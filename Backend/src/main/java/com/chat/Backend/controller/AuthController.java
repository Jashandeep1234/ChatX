package com.chat.Backend.controller;

import com.chat.Backend.dto.request.GoogleLoginRequest;
import com.chat.Backend.dto.response.AuthResponse;
import com.chat.Backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> google(@Valid @RequestBody GoogleLoginRequest req) {
        AuthService.AuthWithRaw result = authService.loginWithGoogleFull(req.idToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authService.refreshCookie(result.rawRefresh(), false).toString())
                .body(result.auth());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@CookieValue(name = AuthService.REFRESH_COOKIE, required = false) String raw) {
        AuthService.AuthWithRaw result = authService.refresh(raw == null ? "" : raw);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authService.refreshCookie(result.rawRefresh(), false).toString())
                .body(result.auth());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = AuthService.REFRESH_COOKIE, required = false) String raw) {
        authService.logout(raw);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authService.refreshCookie("", true).toString())
                .build();
    }
}
