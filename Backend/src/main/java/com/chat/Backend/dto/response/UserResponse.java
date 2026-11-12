package com.chat.Backend.dto.response;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String name,
        String username,
        String avatarUrl,
        boolean online) {
}
