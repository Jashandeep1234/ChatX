package com.chat.Backend.dto.response;

import com.chat.Backend.entity.MemberRole;

import java.util.UUID;

public record MemberResponse(
        UUID userId,
        String name,
        String username,
        String email,
        String avatarUrl,
        MemberRole role,
        boolean online) {
}
