package com.chat.Backend.controller;

import com.chat.Backend.dto.request.AddMembersRequest;
import com.chat.Backend.dto.request.CreateDirectRequest;
import com.chat.Backend.dto.request.CreateGroupRequest;
import com.chat.Backend.dto.request.UpdateGroupRequest;
import com.chat.Backend.dto.request.UpdateRoleRequest;
import com.chat.Backend.dto.response.ConversationResponse;
import com.chat.Backend.security.SecurityUtils;
import com.chat.Backend.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversations;

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> list() {
        return ResponseEntity.ok(conversations.listMine(SecurityUtils.currentUserId()));
    }

    @PostMapping("/direct")
    public ResponseEntity<ConversationResponse> direct(@Valid @RequestBody CreateDirectRequest req) {
        return ResponseEntity.ok(conversations.createDirect(SecurityUtils.currentUserId(), req));
    }

    @PostMapping("/group")
    public ResponseEntity<ConversationResponse> group(@Valid @RequestBody CreateGroupRequest req) {
        return ResponseEntity.ok(conversations.createGroup(SecurityUtils.currentUserId(), req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(conversations.get(SecurityUtils.currentUserId(), id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ConversationResponse> update(@PathVariable UUID id,
                                                       @Valid @RequestBody UpdateGroupRequest req) {
        return ResponseEntity.ok(conversations.updateGroup(SecurityUtils.currentUserId(), id, req));
    }
 
    @PostMapping("/{id}/members")
    public ResponseEntity<ConversationResponse> addMembers(@PathVariable UUID id,
                                                           @Valid @RequestBody AddMembersRequest req) {
        return ResponseEntity.ok(conversations.addMembers(SecurityUtils.currentUserId(), id, req));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID id, @PathVariable UUID userId) {
        conversations.removeMember(SecurityUtils.currentUserId(), id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/members/{userId}")
    public ResponseEntity<ConversationResponse> updateRole(@PathVariable UUID id,
                                                           @PathVariable UUID userId,
                                                           @Valid @RequestBody UpdateRoleRequest req) {
        return ResponseEntity.ok(conversations.updateRole(SecurityUtils.currentUserId(), id, userId, req));
    }
}
