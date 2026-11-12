package com.chat.Backend.dto.response;

import com.chat.Backend.entity.MessageStatus;
import com.chat.Backend.entity.MessageType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String senderName,
        String content,
        MessageType messageType,
        MessageStatus status,
        UUID replyToId,
        List<AttachmentResponse> attachments,
        boolean deleted,
        Instant editedAt,
        Instant createdAt) {
}
