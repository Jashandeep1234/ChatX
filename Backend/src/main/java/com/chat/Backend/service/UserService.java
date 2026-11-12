package com.chat.Backend.service;

import com.chat.Backend.dto.request.UpdateProfileRequest;
import com.chat.Backend.dto.response.UserResponse;
import com.chat.Backend.entity.User;
import com.chat.Backend.exception.BadRequestException;
import com.chat.Backend.exception.ResourceNotFoundException;
import com.chat.Backend.mapper.UserMapper;
import com.chat.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository users;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return userMapper.toResponse(getUser(userId));
    }

    @Transactional
    public UserResponse updateMe(UUID userId, UpdateProfileRequest req) {
        User user = getUser(userId);
        if (req.name() != null && !req.name().isBlank()) {
            user.setName(req.name().trim());
        }
        if (req.username() != null) {
            String normalized = req.username().trim().toLowerCase();
            if (!normalized.matches("^[a-z0-9_.]{3,30}$")) {
                throw new BadRequestException("username must be 3-30 chars: lowercase letters, numbers, _ or .");
            }
            if (!normalized.equals(user.getUsername())) {
                users.findByUsernameIgnoreCase(normalized).ifPresent(other -> {
                    if (!other.getId().equals(userId)) {
                        throw new BadRequestException("Username is already taken");
                    }
                });
                user.setUsername(normalized);
            }
        }
        if (req.avatarUrl() != null) {
            user.setAvatarUrl(req.avatarUrl().isBlank() ? null : req.avatarUrl().trim());
        }
        return userMapper.toResponse(users.save(user));
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> search(UUID callerId, String q, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        String query = q == null ? "" : q.trim();
        // Simple real-user rule: require at least 2 chars so empty search
        // never dumps the whole user table.
        if (query.length() < 2) {
            return Page.empty(PageRequest.of(Math.max(page, 0), safeSize));
        }
        return users.search(query, callerId, PageRequest.of(Math.max(page, 0), safeSize))
                .map(userMapper::toResponse);
    }

    private User getUser(UUID userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
