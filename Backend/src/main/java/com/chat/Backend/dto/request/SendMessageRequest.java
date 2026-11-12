package com.chat.Backend.dto.request;

import com.chat.Backend.entity.MessageType;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SendMessageRequest(
        @Size(max = 4000, message = "content max 4000 chars") String content,
        MessageType type,
        UUID replyToId,
        List<UUID> attachmentIds) {
}
