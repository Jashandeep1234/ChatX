package com.chat.Backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDirectRequest(
        @NotNull(message = "userId is required") UUID userId) {
}
