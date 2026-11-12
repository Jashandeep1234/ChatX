package com.chat.Backend.dto.request;

import com.chat.Backend.entity.MemberRole;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull(message = "role is required") MemberRole role) {
}
