package com.chat.Backend.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";

    private final JwtService jwt = new JwtService(SECRET, 900000);

    @Test
    void roundTrip() {
        UUID id = UUID.randomUUID();
        String token = jwt.generateAccessToken(id, "a@b.c");
        assertThat(jwt.valid(token)).isTrue();
        assertThat(jwt.userIdOf(token)).isEqualTo(id);
        assertThat(jwt.parse(token).get("email")).isEqualTo("a@b.c");
    }

    @Test
    void garbageIsInvalid() {
        assertThat(jwt.valid("not-a-token")).isFalse();
        assertThat(jwt.valid(jwt.generateAccessToken(UUID.randomUUID(), "x@y.z") + "tampered")).isFalse();
    }

    @Test
    void shortSecretRejected() {
        assertThatThrownBy(() -> new JwtService("too-short", 900000))
                .isInstanceOf(IllegalStateException.class);
    }
}
