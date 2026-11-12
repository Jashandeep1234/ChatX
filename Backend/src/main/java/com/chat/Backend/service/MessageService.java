package com.chat.Backend.service;

import com.chat.Backend.dto.request.EditMessageRequest;
import com.chat.Backend.dto.request.MarkReadRequest;
import com.chat.Backend.dto.request.SendMessageRequest;
import com.chat.Backend.dto.response.MessagePageResponse;
import com.chat.Backend.dto.response.MessageResponse;
import com.chat.Backend.entity.Conversation;
import com.chat.Backend.entity.ConversationMember;
import com.chat.Backend.entity.Message;
import com.chat.Backend.entity.MessageStatus;
import com.chat.Backend.entity.MessageType;
import com.chat.Backend.entity.User;
import com.chat.Backend.exception.BadRequestException;
import com.chat.Backend.exception.ForbiddenException;
import com.chat.Backend.exception.ResourceNotFoundException;
import com.chat.Backend.repository.ConversationMemberRepository;
import com.chat.Backend.repository.ConversationRepository;
import com.chat.Backend.repository.MessageAttachmentRepository;
import com.chat.Backend.repository.MessageRepository;
import com.chat.Backend.repository.UserRepository;
import com.chat.Backend.websocket.WsEvent;
import com.chat.Backend.websocket.WsEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final int DEFAULT_LIMIT = 30;
    private static final int MAX_LIMIT = 100;

    private final MessageRepository messages;
    private final ConversationRepository conversations;
    private final ConversationMemberRepository members;
    private final UserRepository users;
    private final MessageAttachmentRepository attachments;
    private final ConversationService conversationsSvc;
    private final PresenceService presence;
    private final RateLimitService rateLimits;

    // ---------- history: cursor pagination, 30/page, newest first ----------

    @Transactional(readOnly = true)
    public MessagePageResponse history(UUID callerId, UUID conversationId, String cursor, int limit) {
        members.findByConversationIdAndUserId(conversationId, callerId)
                .orElseThrow(() -> new ForbiddenException("Not a member of this conversation"));
        int size = Math.min(Math.max(limit <= 0 ? DEFAULT_LIMIT : limit, 1), MAX_LIMIT);
        // Fetch one extra to know hasMore
        List<Message> rows;
        if (cursor == null || cursor.isBlank()) {
            rows = messages.findByConversationIdOrderByCreatedAtDescIdDesc(conversationId, PageRequest.of(0, size + 1));
        } else {
            Instant cursorTime = parseCursor(cursor);
            rows = messages.findByConversationIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                    conversationId, cursorTime, PageRequest.of(0, size + 1));
        }
        boolean hasMore = rows.size() > size;
        List<Message> page = hasMore ? rows.subList(0, size) : rows;
        List<MessageResponse> dtos = page.stream().map(conversationsSvc::toMessageDto).toList();
        String nextCursor = page.isEmpty() ? null : page.get(page.size() - 1).getCreatedAt().toString();
        return new MessagePageResponse(dtos, nextCursor, hasMore);
    }

    // ---------- send ----------

    @Transactional
    public MessageResponse send(UUID callerId, UUID conversationId, SendMessageRequest req) {
        rateLimits.checkMessages(callerId);
        Conversation conv = conversations.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        members.findByConversationIdAndUserId(conversationId, callerId)
                .orElseThrow(() -> new ForbiddenException("Not a member of this conversation"));
        User sender = users.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        MessageType type = req.type() == null ? MessageType.TEXT : req.type();
        List<UUID> attIds = req.attachmentIds() == null ? List.of() : req.attachmentIds();
        if (type == MessageType.SYSTEM) {
            throw new BadRequestException("Cannot send SYSTEM messages");
        }
        if (type == MessageType.TEXT && (req.content() == null || req.content().isBlank())) {
            throw new BadRequestException("content is required for TEXT messages");
        }
        if ((type == MessageType.IMAGE || type == MessageType.FILE) && attIds.isEmpty()) {
            throw new BadRequestException("attachmentIds required for " + type + " messages");
        }

        Message replyTo = null;
        if (req.replyToId() != null) {
            replyTo = messages.findById(req.replyToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reply-to message not found"));
            if (!replyTo.getConversation().getId().equals(conversationId)) {
                throw new BadRequestException("Reply-to message is in another conversation");
            }
        }

        var atts = attIds.isEmpty() ? List.<com.chat.Backend.entity.MessageAttachment>of()
                : attachments.findByIdIn(attIds);
        if (atts.size() != attIds.size()) {
            throw new BadRequestException("One or more attachments not found");
        }

        Message m = messages.save(Message.builder()
                .conversation(conv)
                .sender(sender)
                .content(req.content())
                .messageType(type)
                .replyTo(replyTo)
                .status(MessageStatus.DELIVERED)
                .build());
        for (var a : atts) {
            a.setMessage(m);
            attachments.save(a);
        }
        conversations.save(conv); // bump updated_at for list ordering

        MessageResponse dto = conversationsSvc.toMessageDto(m);
        presence.sendToConversation(conversationId, WsEvent.of(WsEventType.MESSAGE_NEW, conversationId, callerId, dto));
        return dto;
    }

    // ---------- edit / delete (own messages) ----------

    @Transactional
    public MessageResponse edit(UUID callerId, UUID messageId, EditMessageRequest req) {
        Message m = messages.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        assertMember(m.getConversation().getId(), callerId);
        if (m.getSender() == null || !m.getSender().getId().equals(callerId)) {
            throw new ForbiddenException("Can only edit your own messages");
        }
        if (m.isDeleted()) {
            throw new BadRequestException("Message is deleted");
        }
        if (m.getMessageType() == MessageType.SYSTEM) {
            throw new BadRequestException("System messages cannot be edited");
        }
        m.setContent(req.content());
        m.setEditedAt(Instant.now());
        messages.save(m);
        MessageResponse dto = conversationsSvc.toMessageDto(m);
        presence.sendToConversation(m.getConversation().getId(),
                WsEvent.of(WsEventType.MESSAGE_EDITED, m.getConversation().getId(), callerId, dto));
        return dto;
    }

    @Transactional
    public void delete(UUID callerId, UUID messageId) {
        Message m = messages.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        assertMember(m.getConversation().getId(), callerId);
        if (m.getSender() == null || !m.getSender().getId().equals(callerId)) {
            throw new ForbiddenException("Can only delete your own messages");
        }
        m.setDeleted(true);
        messages.save(m);
        presence.sendToConversation(m.getConversation().getId(),
                WsEvent.of(WsEventType.MESSAGE_DELETED, m.getConversation().getId(), callerId,
                        Map.of("messageId", messageId)));
    }

    // ---------- read receipts + unread ----------

    @Transactional
    public void markRead(UUID callerId, UUID conversationId, MarkReadRequest req) {
        ConversationMember self = members.findByConversationIdAndUserId(conversationId, callerId)
                .orElseThrow(() -> new ForbiddenException("Not a member of this conversation"));
        Message target = messages.findById(req.messageId())
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!target.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Message is in another conversation");
        }
        self.setLastReadMessageId(target.getId());
        members.save(self);

        // Bulk update: everything from others up to this message counts as READ
        messages.markReadUpTo(conversationId, target.getCreatedAt(), callerId);
        presence.sendToConversation(conversationId,
                WsEvent.of(WsEventType.MESSAGE_READ, conversationId, callerId,
                        Map.of("readerId", callerId, "messageId", target.getId())));
    }

    // ---------- helpers ----------

    private void assertMember(UUID conversationId, UUID userId) {
        members.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a member of this conversation"));
    }

    private Instant parseCursor(String cursor) {
        try {
            return Instant.parse(cursor);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Invalid cursor, expected ISO-8601 instant");
        }
    }
}
