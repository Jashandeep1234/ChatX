package com.chat.Backend.dto.response;

public record AuthResponse(
        String accessToken,
        UserResponse user) {
}
