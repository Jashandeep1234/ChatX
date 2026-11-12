package com.chat.Backend.dto.response;

import com.chat.Backend.entity.ConversationType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        ConversationType type,
        String name,
        String avatarUrl,
        List<MemberResponse> members,
        MessageResponse lastMessage,
        long unreadCount,
        Instant updatedAt) {
}
