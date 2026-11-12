package com.chat.Backend.service;

import com.chat.Backend.exception.RateLimitException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class RateLimitServiceTest {

    private final RateLimitService limits = new RateLimitService();

    @Test
    void messagesAllowBurstThenReject() {
        UUID user = UUID.randomUUID();
        for (int i = 0; i < 60; i++) {
            limits.checkMessages(user);
        }
        assertThatThrownBy(() -> limits.checkMessages(user)).isInstanceOf(RateLimitException.class);
    }

    @Test
    void bucketsArePerUser() {
        UUID user = UUID.randomUUID();
        for (int i = 0; i < 60; i++) {
            limits.checkMessages(user);
        }
        // Different user unaffected
        limits.checkMessages(UUID.randomUUID());
    }

    @Test
    void uploadsHaveOwnSmallerBucket() {
        UUID user = UUID.randomUUID();
        for (int i = 0; i < 20; i++) {
            limits.checkUploads(user);
        }
        assertThatThrownBy(() -> limits.checkUploads(user)).isInstanceOf(RateLimitException.class);
    }
}
