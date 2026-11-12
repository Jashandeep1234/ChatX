package com.chat.Backend.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public record StoredFile(String url, String storedName, String fileName, String mimeType, long size) {
}
