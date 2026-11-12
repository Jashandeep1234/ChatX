package com.chat.Backend.service;

import com.chat.Backend.dto.response.AuthResponse;
import com.chat.Backend.entity.RefreshToken;
import com.chat.Backend.entity.User;
import com.chat.Backend.exception.BadRequestException;
import com.chat.Backend.mapper.UserMapper;
import com.chat.Backend.repository.RefreshTokenRepository;
import com.chat.Backend.repository.UserRepository;
import com.chat.Backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String REFRESH_COOKIE = "refresh_token";

    private final GoogleTokenVerifier googleVerifier;
    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Value("${jwt.refresh-expiry-ms:604800000}")
    private long refreshExpiryMs;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    private final SecureRandom random = new SecureRandom();

    public record TokenPair(String accessToken, String refreshTokenRaw) {
    }

    @Transactional
    public TokenPair issueTokens(User user) {
        String raw = generateRawToken();
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenHash(sha256(raw))
                .expiresAt(Instant.now().plusMillis(refreshExpiryMs))
                .build();
        refreshTokens.save(rt);
        return new TokenPair(jwtService.generateAccessToken(user.getId(), user.getEmail()), raw);
    }

    // Login flow needs both tokens; keep a clean API for the controller
    @Transactional
    public AuthWithRaw loginWithGoogleFull(String idToken) {
        var payload = googleVerifier.verify(idToken);
        String googleId = payload.getSubject();
        String email = payload.getEmail();
        if (googleId == null || email == null) {
            throw new BadRequestException("Google token missing subject/email");
        }
        // Real-user safety: only allow verified Google emails.
        Boolean verified = payload.getEmailVerified();
        if (verified != null && !verified) {
            throw new BadRequestException("Google email is not verified");
        }
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        User user = users.findByGoogleId(googleId).orElseGet(() -> users.findByEmail(email).orElse(null));
        if (user == null) {
            user = User.builder().googleId(googleId).email(email)
                    .name(name != null ? name : email).avatarUrl(picture).build();
            user.setUsername(generateUniqueUsername(name != null ? name : email));
        } else {
            user.setGoogleId(googleId);
            if (name != null) {
                user.setName(name);
            }
            if (picture != null) {
                user.setAvatarUrl(picture);
            }
            // Backfill handles for accounts created before usernames existed.
            if (user.getUsername() == null || user.getUsername().isBlank()) {
                user.setUsername(generateUniqueUsername(
                        user.getName() != null ? user.getName() : user.getEmail()));
            }
        }
        user = users.save(user);
        TokenPair pair = issueTokens(user);
        return new AuthWithRaw(new AuthResponse(pair.accessToken(), userMapper.toResponse(user)), pair.refreshTokenRaw());
    }

    public record AuthWithRaw(AuthResponse auth, String rawRefresh) {
    }

    @Transactional
    public AuthWithRaw refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException("Missing refresh token");
        }
        RefreshToken rt = refreshTokens.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        if (rt.isRevoked() || rt.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Refresh token expired or revoked");
        }
        // Rotate: revoke old, issue new
        rt.setRevoked(true);
        refreshTokens.save(rt);
        User user = rt.getUser();
        TokenPair pair = issueTokens(user);
        return new AuthWithRaw(
                new AuthResponse(pair.accessToken(), userMapper.toResponse(user)),
                pair.refreshTokenRaw());
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokens.findByTokenHash(sha256(rawToken)).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokens.save(rt);
        });
    }

    public ResponseCookie refreshCookie(String rawToken, boolean clear) {
        // Local http dev needs Secure=false + Lax; HTTPS prod needs Secure + None.
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from(REFRESH_COOKIE, clear ? "" : rawToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax")
                .path("/")
                .maxAge(clear ? Duration.ZERO : Duration.ofMillis(refreshExpiryMs));
        return b.build();
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Build a unique lowercase handle from a name/email, e.g. "Alex Chen" -> "alex.chen". */
    String generateUniqueUsername(String source) {
        String base = source == null ? "user" : source.trim().toLowerCase();
        // If it looks like an email, use the local part.
        if (base.contains("@")) {
            base = base.substring(0, base.indexOf('@'));
        }
        base = base.replaceAll("[^a-z0-9_.]", ".").replaceAll("\\.{2,}", ".")
                .replaceAll("^[._]+|[._]+$", "");
        if (base.length() < 3) {
            base = (base + "user").substring(0, Math.min(3, base.length() + 4));
        }
        if (base.length() > 24) {
            base = base.substring(0, 24);
        }
        String candidate = base;
        int suffix = 0;
        while (users.findByUsernameIgnoreCase(candidate).isPresent()) {
            suffix++;
            String tail = "." + suffix;
            candidate = base.substring(0, Math.min(base.length(), 30 - tail.length())) + tail;
            // Safety valve — should never loop this far.
            if (suffix > 10000) {
                candidate = "user." + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }
        return candidate;
    }

    static String sha256(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte x : hash) {
                sb.append(String.format("%02x", x));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
