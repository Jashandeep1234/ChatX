package com.chat.Backend.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateGroupRequest(
        @Size(min = 1, max = 255, message = "name must be 1-255 chars") String name,
        @Size(max = 1024) String avatarUrl) {
}
