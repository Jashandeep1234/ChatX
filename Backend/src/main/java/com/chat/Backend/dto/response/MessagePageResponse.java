package com.chat.Backend.dto.response;

import java.util.List;

public record MessagePageResponse(
        List<MessageResponse> messages,
        String nextCursor,
        boolean hasMore) {
}
