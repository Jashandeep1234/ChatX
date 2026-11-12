package com.chat.Backend.controller;

import com.chat.Backend.dto.response.FileUploadResponse;
import com.chat.Backend.security.SecurityUtils;
import com.chat.Backend.service.FileService;
import com.chat.Backend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final StorageService storage;

    @PostMapping(value = "/api/files/upload", consumes = "multipart/form-data")
    public ResponseEntity<FileUploadResponse> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileService.upload(SecurityUtils.currentUserId(), file));
    }

    // Serves local-disk uploads (storage.type=local). S3 objects use presigned URLs instead.
    @GetMapping("/api/files/local/{name:.+}")
    public ResponseEntity<Resource> serveLocal(@PathVariable String name) {
        Resource r = storage.serve(name);
        String contentType = MediaTypeFactory.getMediaType(r).map(Object::toString)
                .orElse("application/octet-stream");
        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .header("Cache-Control", "public, max-age=86400")
                .body(r);
    }
}
