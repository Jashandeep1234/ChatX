package com.chat.Backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateGroupRequest(
        @NotBlank(message = "name is required") @Size(max = 255) String name,
        @Size(max = 500, message = "too many members") List<UUID> memberIds) {
}
