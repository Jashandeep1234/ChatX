package com.chat.Backend.service.storage;

import com.chat.Backend.exception.BadRequestException;
import com.chat.Backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final Path root;

    public LocalStorageService(@Value("${storage.local.location:./uploads}") String location) throws IOException {
        this.root = Paths.get(location).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    @Override
    public StoredFile store(MultipartFile file) throws IOException {
        String safe = sanitize(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "_" + safe;
        Files.copy(file.getInputStream(), root.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        String name = file.getOriginalFilename() == null ? storedName : file.getOriginalFilename();
        return new StoredFile("/api/files/local/" + storedName, storedName, name,
                file.getContentType(), file.getSize());
    }

    @Override
    public Resource serve(String storedName) {
        if (storedName.contains("..") || storedName.contains("/") || storedName.contains("\\")) {
            throw new BadRequestException("Invalid file name");
        }
        try {
            Path p = root.resolve(storedName).normalize();
            if (!p.startsWith(root) || !Files.isRegularFile(p)) {
                throw new ResourceNotFoundException("File not found");
            }
            return new UrlResource(p.toUri());
        } catch (ResourceNotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new ResourceNotFoundException("File not found");
        }
    }

    private String sanitize(String original) {
        if (original == null || original.isBlank()) {
            return "file";
        }
        String base = Paths.get(original).getFileName().toString();
        return base.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
