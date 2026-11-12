package com.chat.Backend.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 100, message = "name must be 1-100 chars") String name,
        @Size(min = 3, max = 30, message = "username must be 3-30 chars")
        @Pattern(regexp = "^[a-z0-9_.]{3,30}$", message = "username must be lowercase letters, numbers, _ or .") String username,
        @Size(max = 1024, message = "avatarUrl too long") String avatarUrl) {
}
