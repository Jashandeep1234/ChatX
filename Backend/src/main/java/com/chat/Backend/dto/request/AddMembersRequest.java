package com.chat.Backend.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record AddMembersRequest(
        @NotEmpty(message = "memberIds must not be empty") List<UUID> memberIds) {
}
