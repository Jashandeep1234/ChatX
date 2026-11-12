package com.chat.Backend.controller;

import com.chat.Backend.dto.request.EditMessageRequest;
import com.chat.Backend.dto.request.MarkReadRequest;
import com.chat.Backend.dto.request.SendMessageRequest;
import com.chat.Backend.dto.response.MessagePageResponse;
import com.chat.Backend.dto.response.MessageResponse;
import com.chat.Backend.security.SecurityUtils;
import com.chat.Backend.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/api/conversations/{id}/messages")
    public ResponseEntity<MessagePageResponse> history(
            @PathVariable UUID id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(messageService.history(SecurityUtils.currentUserId(), id, cursor, limit));
    }

    @PostMapping("/api/conversations/{id}/messages")
    public ResponseEntity<MessageResponse> send(@PathVariable UUID id,
                                                @Valid @RequestBody SendMessageRequest req) {
        return ResponseEntity.ok(messageService.send(SecurityUtils.currentUserId(), id, req));
    }

    @PatchMapping("/api/messages/{id}")
    public ResponseEntity<MessageResponse> edit(@PathVariable UUID id,
                                                @Valid @RequestBody EditMessageRequest req) {
        return ResponseEntity.ok(messageService.edit(SecurityUtils.currentUserId(), id, req));
    }

    @DeleteMapping("/api/messages/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        messageService.delete(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/conversations/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id,
                                         @Valid @RequestBody MarkReadRequest req) {
        messageService.markRead(SecurityUtils.currentUserId(), id, req);
        return ResponseEntity.noContent().build();
    }
}
