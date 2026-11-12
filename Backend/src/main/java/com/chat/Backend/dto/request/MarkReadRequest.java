package com.chat.Backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MarkReadRequest(
        @NotNull(message = "messageId is required") UUID messageId) {
}
