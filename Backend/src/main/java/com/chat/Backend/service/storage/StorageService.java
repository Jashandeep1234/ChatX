package com.chat.Backend.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface StorageService {

    StoredFile store(MultipartFile file) throws IOException;

    /** Serves a previously stored object (local disk). S3 uses presigned URLs instead. */
    Resource serve(String storedName);
}
