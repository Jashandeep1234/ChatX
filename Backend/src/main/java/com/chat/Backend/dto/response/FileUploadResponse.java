package com.chat.Backend.dto.response;

import java.util.UUID;

public record FileUploadResponse(
        UUID id,
        String fileUrl,
        String fileName,
        String mimeType,
        long fileSize) {
}
