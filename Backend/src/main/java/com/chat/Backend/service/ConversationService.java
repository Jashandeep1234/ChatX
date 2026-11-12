package com.chat.Backend.service;

import com.chat.Backend.dto.request.AddMembersRequest;
import com.chat.Backend.dto.request.CreateDirectRequest;
import com.chat.Backend.dto.request.CreateGroupRequest;
import com.chat.Backend.dto.request.UpdateGroupRequest;
import com.chat.Backend.dto.request.UpdateRoleRequest;
import com.chat.Backend.dto.response.AttachmentResponse;
import com.chat.Backend.dto.response.ConversationResponse;
import com.chat.Backend.dto.response.MemberResponse;
import com.chat.Backend.dto.response.MessageResponse;
import com.chat.Backend.entity.Conversation;
import com.chat.Backend.entity.ConversationMember;
import com.chat.Backend.entity.ConversationType;
import com.chat.Backend.entity.MemberRole;
import com.chat.Backend.entity.Message;
import com.chat.Backend.entity.MessageStatus;
import com.chat.Backend.entity.MessageType;
import com.chat.Backend.entity.User;
import com.chat.Backend.exception.BadRequestException;
import com.chat.Backend.exception.ForbiddenException;
import com.chat.Backend.exception.ResourceNotFoundException;
import com.chat.Backend.mapper.ChatMapper;
import com.chat.Backend.repository.ConversationMemberRepository;
import com.chat.Backend.repository.ConversationRepository;
import com.chat.Backend.repository.MessageAttachmentRepository;
import com.chat.Backend.repository.MessageRepository;
import com.chat.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversations;
    private final ConversationMemberRepository members;
    private final UserRepository users;
    private final MessageRepository messages;
    private final MessageAttachmentRepository attachments;
    private final ChatMapper chatMapper;

    // ---------- queries ----------

    @Transactional(readOnly = true)
    public List<ConversationResponse> listMine(UUID userId) {
        List<ConversationMember> mine = members.findByUserId(userId);
        List<ConversationResponse> out = new ArrayList<>();
        for (ConversationMember m : mine) {
            out.add(toResponse(m.getConversation().getId(), userId));
        }
        out.sort(Comparator.comparing(ConversationResponse::updatedAt,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return out;
    }

    @Transactional(readOnly = true)
    public ConversationResponse get(UUID userId, UUID conversationId) {
        requireMember(conversationId, userId);
        return toResponse(conversationId, userId);
    }

    // ---------- 1:1 ----------

    @Transactional
    public ConversationResponse createDirect(UUID callerId, CreateDirectRequest req) {
        if (callerId.equals(req.userId())) {
            throw new BadRequestException("Cannot create a direct chat with yourself");
        }
        User caller = getUser(callerId);
        User other = getUser(req.userId());

        String key = Conversation.directKeyFor(callerId, other.getId());
        Conversation existing = conversations.findByDirectKey(key).orElse(null);
        if (existing != null) {
            return toResponse(existing.getId(), callerId);
        }

        Conversation conv = conversations.save(Conversation.builder()
                .type(ConversationType.ONE_TO_ONE)
                .directKey(key)
                .createdBy(caller)
                .build());
        members.save(ConversationMember.builder().conversation(conv).user(caller).role(MemberRole.MEMBER).build());
        members.save(ConversationMember.builder().conversation(conv).user(other).role(MemberRole.MEMBER).build());
        return toResponse(conv.getId(), callerId);
    }

    // ---------- group ----------

    @Transactional
    public ConversationResponse createGroup(UUID callerId, CreateGroupRequest req) {
        User caller = getUser(callerId);
        Set<UUID> ids = new LinkedHashSet<>(req.memberIds() == null ? List.of() : req.memberIds());
        ids.remove(callerId);

        Conversation conv = conversations.save(Conversation.builder()
                .type(ConversationType.GROUP)
                .name(req.name().trim())
                .createdBy(caller)
                .build());
        members.save(ConversationMember.builder().conversation(conv).user(caller).role(MemberRole.ADMIN).build());
        for (UUID id : ids) {
            members.save(ConversationMember.builder().conversation(conv).user(getUser(id)).role(MemberRole.MEMBER).build());
        }
        systemMessage(conv, caller, caller.getName() + " created the group");
        return toResponse(conv.getId(), callerId);
    }

    @Transactional
    public ConversationResponse updateGroup(UUID callerId, UUID conversationId, UpdateGroupRequest req) {
        Conversation conv = getConversation(conversationId);
        requireType(conv, ConversationType.GROUP);
        ConversationMember self = requireMember(conversationId, callerId);
        requireAdmin(self);

        boolean renamed = false;
        if (req.name() != null && !req.name().isBlank() && !req.name().trim().equals(conv.getName())) {
            conv.setName(req.name().trim());
            renamed = true;
        }
        if (req.avatarUrl() != null) {
            conv.setAvatarUrl(req.avatarUrl().isBlank() ? null : req.avatarUrl().trim());
        }
        conversations.save(conv);
        if (renamed) {
            systemMessage(conv, getUser(callerId),
                    self.getUser().getName() + " renamed the group to \"" + conv.getName() + "\"");
        }
        return toResponse(conversationId, callerId);
    }

    @Transactional
    public ConversationResponse addMembers(UUID callerId, UUID conversationId, AddMembersRequest req) {
        Conversation conv = getConversation(conversationId);
        requireType(conv, ConversationType.GROUP);
        ConversationMember self = requireMember(conversationId, callerId);
        requireAdmin(self);

        List<String> addedNames = new ArrayList<>();
        for (UUID id : new LinkedHashSet<>(req.memberIds())) {
            if (members.existsByConversationIdAndUserId(conversationId, id)) {
                continue;
            }
            User u = getUser(id);
            members.save(ConversationMember.builder().conversation(conv).user(u).role(MemberRole.MEMBER).build());
            addedNames.add(u.getName());
        }
        if (!addedNames.isEmpty()) {
            systemMessage(conv, getUser(callerId),
                    self.getUser().getName() + " added " + String.join(", ", addedNames));
        }
        return toResponse(conversationId, callerId);
    }

    @Transactional
    public void removeMember(UUID callerId, UUID conversationId, UUID targetUserId) {
        Conversation conv = getConversation(conversationId);
        ConversationMember self = requireMember(conversationId, callerId);
        ConversationMember target = members.findByConversationIdAndUserId(conversationId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        boolean selfLeave = callerId.equals(targetUserId);
        if (conv.getType() == ConversationType.ONE_TO_ONE && !selfLeave) {
            throw new BadRequestException("Cannot remove the other user from a direct chat");
        }
        if (!selfLeave) {
            // Removing someone else requires admin (groups only)
            requireType(conv, ConversationType.GROUP);
            requireAdmin(self);
            systemMessage(conv, getUser(callerId),
                    self.getUser().getName() + " removed " + target.getUser().getName());
        } else {
            if (conv.getType() == ConversationType.GROUP) {
                systemMessage(conv, target.getUser(), target.getUser().getName() + " left");
            }
        }

        boolean targetWasAdmin = target.getRole() == MemberRole.ADMIN;
        members.delete(target);

        if (conv.getType() == ConversationType.GROUP) {
            long remaining = members.countByConversationId(conversationId);
            if (remaining == 0) {
                conversations.delete(conv);
                return;
            }
            // Last admin left: promote oldest remaining member
            if (targetWasAdmin && members.countByConversationIdAndRole(conversationId, MemberRole.ADMIN) == 0) {
                members.findFirstByConversationIdOrderByJoinedAtAsc(conversationId).ifPresent(oldest -> {
                    oldest.setRole(MemberRole.ADMIN);
                    members.save(oldest);
                });
            }
        } else {
            // 1:1 leave: delete conversation once someone leaves (keeps model simple)
            if (members.countByConversationId(conversationId) < 2) {
                conversations.delete(conv);
            }
        }
    }

    @Transactional
    public ConversationResponse updateRole(UUID callerId, UUID conversationId, UUID targetUserId, UpdateRoleRequest req) {
        Conversation conv = getConversation(conversationId);
        requireType(conv, ConversationType.GROUP);
        ConversationMember self = requireMember(conversationId, callerId);
        requireAdmin(self);
        ConversationMember target = members.findByConversationIdAndUserId(conversationId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (target.getRole() != req.role()) {
            if (target.getRole() == MemberRole.ADMIN && req.role() == MemberRole.MEMBER
                    && members.countByConversationIdAndRole(conversationId, MemberRole.ADMIN) <= 1) {
                throw new BadRequestException("Cannot demote the last admin");
            }
            target.setRole(req.role());
            members.save(target);
            systemMessage(conv, getUser(callerId), self.getUser().getName()
                    + (req.role() == MemberRole.ADMIN ? " promoted " : " demoted ")
                    + target.getUser().getName());
        }
        return toResponse(conversationId, callerId);
    }

    // ---------- guards (reused by message/file/websocket layers) ----------

    @Transactional(readOnly = true)
    public ConversationMember requireMember(UUID conversationId, UUID userId) {
        return members.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a member of this conversation"));
    }

    public void requireAdmin(ConversationMember member) {
        if (member.getRole() != MemberRole.ADMIN) {
            throw new ForbiddenException("Admin role required");
        }
    }

    // ---------- assembly ----------

    @Transactional(readOnly = true)
    public ConversationResponse toResponse(UUID conversationId, UUID viewerId) {
        Conversation conv = getConversation(conversationId);
        List<ConversationMember> all = members.findByConversationId(conversationId);
        List<MemberResponse> memberDtos = all.stream().map(chatMapper::toMemberResponse).toList();

        Message last = messages.findFirstByConversationIdOrderByCreatedAtDescIdDesc(conversationId).orElse(null);
        MessageResponse lastDto = last == null ? null : toMessageDto(last);
        long unread = countUnread(conversationId, viewerId);

        return new ConversationResponse(conv.getId(), conv.getType(), conv.getName(), conv.getAvatarUrl(),
                memberDtos, lastDto, unread, conv.getUpdatedAt());
    }

    public long countUnread(UUID conversationId, UUID viewerId) {
        ConversationMember self = members.findByConversationIdAndUserId(conversationId, viewerId).orElse(null);
        if (self == null) {
            return 0;
        }
        if (self.getLastReadMessageId() == null) {
            return messages.countUnreadNoCursor(conversationId, viewerId);
        }
        Message lastRead = messages.findById(self.getLastReadMessageId()).orElse(null);
        if (lastRead == null) {
            return messages.countUnreadNoCursor(conversationId, viewerId);
        }
        return messages.countUnread(conversationId, lastRead.getCreatedAt(), viewerId);
    }

    public MessageResponse toMessageDto(Message m) {
        MessageResponse base = chatMapper.toMessageResponse(m);
        List<AttachmentResponse> atts = attachments.findByMessageId(m.getId()).stream()
                .map(chatMapper::toAttachmentResponse).toList();
        String content = m.isDeleted() ? null : base.content();
        return new MessageResponse(base.id(), base.conversationId(), base.senderId(), base.senderName(),
                content, base.messageType(), base.status(), base.replyToId(), atts,
                base.deleted(), base.editedAt(), base.createdAt());
    }

    // ---------- helpers ----------

    private void requireType(Conversation conv, ConversationType type) {
        if (conv.getType() != type) {
            throw new BadRequestException("Operation allowed only on " + type + " conversations");
        }
    }

    private Conversation getConversation(UUID id) {
        return conversations.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    }

    private User getUser(UUID id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private void systemMessage(Conversation conv, User actor, String text) {
        messages.save(Message.builder()
                .conversation(conv)
                .sender(actor)
                .content(text)
                .messageType(MessageType.SYSTEM)
                .status(MessageStatus.SENT)
                .build());
        // Touch conversation so list ordering reflects activity
        conversations.save(conv);
    }

    /** Display names for 1:1 chats fall back to the other member's name. */
    public String displayName(ConversationResponse r, UUID viewerId) {
        if (r.type() == ConversationType.GROUP || r.name() != null) {
            return r.name();
        }
        return r.members().stream().filter(m -> !m.userId().equals(viewerId))
                .map(MemberResponse::name).findFirst().orElse("Direct chat");
    }

    public String memberNames(List<UUID> ids) {
        return ids.stream().map(this::getUser).map(User::getName).collect(Collectors.joining(", "));
    }
}
