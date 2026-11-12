package com.chat.Backend.service;

import com.chat.Backend.exception.BadRequestException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Verifies Google ID tokens server-side (ID-token flow only).
 * NOTE: Google Client SECRET is NOT used anywhere — the frontend sends an
 * ID token from the Google button, we verify its audience == GOOGLE_CLIENT_ID.
 * Keep the secret safe in Google Console, do not put it in .env.
 */
@Service
public class GoogleTokenVerifier {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GoogleTokenVerifier.class);

    private final GoogleIdTokenVerifier verifier;
    private final boolean configured;

    public GoogleTokenVerifier(@Value("${google.client-id:}") String clientId) {
        boolean ok = clientId != null && !clientId.isBlank();
        this.configured = ok;
        if (!ok) {
            log.error("GOOGLE_CLIENT_ID is blank — Google login will fail with 'Invalid Google ID token'. Set GOOGLE_CLIENT_ID env.");
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(ok
                        ? Collections.singletonList(clientId.trim())
                        : Collections.emptyList())
                .build();
    }

    public GoogleIdToken.Payload verify(String idToken) {
        if (!configured) {
            throw new BadRequestException("Google login is not configured on the server (missing GOOGLE_CLIENT_ID)");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Missing Google ID token");
        }
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new BadRequestException("Invalid Google ID token (wrong audience or expired — check GOOGLE_CLIENT_ID matches frontend)");
            }
            return token.getPayload();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Google token verification failed: {}", e.getMessage());
            throw new BadRequestException("Google token verification failed");
        }
    }
}
