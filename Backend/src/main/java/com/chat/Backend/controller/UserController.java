package com.chat.Backend.controller;

import com.chat.Backend.dto.request.UpdateProfileRequest;
import com.chat.Backend.dto.response.UserResponse;
import com.chat.Backend.security.SecurityUtils;
import com.chat.Backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userService.me(SecurityUtils.currentUserId()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateMe(SecurityUtils.currentUserId(), req));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserResponse>> search(
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.search(SecurityUtils.currentUserId(), q, page, size));
    }
}
