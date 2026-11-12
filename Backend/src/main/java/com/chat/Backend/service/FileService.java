package com.chat.Backend.service;

import com.chat.Backend.dto.response.FileUploadResponse;
import com.chat.Backend.entity.MessageAttachment;
import com.chat.Backend.exception.BadRequestException;
import com.chat.Backend.repository.MessageAttachmentRepository;
import com.chat.Backend.service.storage.StorageService;
import com.chat.Backend.service.storage.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Validates extension + MIME server-side, stores via the active
 * StorageService (local/s3), and persists metadata with message_id NULL
 * until the file is linked to a message on send.
 */
@Service
@RequiredArgsConstructor
public class FileService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FileService.class);

    // extension -> expected MIME
    private static final Map<String, String> ALLOWED = Map.of(
            "jpg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "gif", "image/gif",
            "pdf", "application/pdf",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "txt", "text/plain");

    private final StorageService storage;
    private final MessageAttachmentRepository attachments;
    private final RateLimitService rateLimits;

    @Value("${app.upload.max-bytes:26214400}")
    private long maxBytes;

    @Transactional
    public FileUploadResponse upload(UUID callerId, MultipartFile file) {
        rateLimits.checkUploads(callerId);
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        if (file.getSize() > maxBytes) {
            throw new BadRequestException("File exceeds 25 MB limit");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = extensionOf(original);
        String expected = ALLOWED.get(ext);
        if (expected == null) {
            throw new BadRequestException("File type not allowed: ." + ext);
        }
        String actual = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!mimeMatches(ext, actual, expected)) {
            throw new BadRequestException("MIME type mismatch for ." + ext + ": " + file.getContentType());
        }

        try {
            StoredFile stored = storage.store(file);
            MessageAttachment att = attachments.save(MessageAttachment.builder()
                    .fileUrl(stored.url())
                    .fileName(original)
                    .mimeType(expected)
                    .fileSize(file.getSize())
                    .build());
            return new FileUploadResponse(att.getId(), stored.url(), original, expected, file.getSize());
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("File upload failed for user {}: {}", callerId, e.getMessage(), e);
            throw new BadRequestException("File upload failed: " + e.getMessage());
        }
    }

    private String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) {
            return "";
        }
        return name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    // Browsers sometimes send "image/jpg" or suffixed types like "text/plain;charset=..."; normalize before compare
    private boolean mimeMatches(String ext, String actual, String expected) {
        String base = actual.split(";")[0].trim();
        if (base.equals(expected)) {
            return true;
        }
        return ext.equals("jpg") && base.equals("image/jpg");
    }
}
