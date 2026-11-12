package com.chat.Backend.websocket;

import com.chat.Backend.dto.request.MarkReadRequest;
import com.chat.Backend.dto.request.SendMessageRequest;
import com.chat.Backend.entity.MessageType;
import com.chat.Backend.repository.ConversationMemberRepository;
import com.chat.Backend.service.MessageService;
import com.chat.Backend.service.PresenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

/** STOMP handlers: /app/chat.send, /app/chat.typing, /app/chat.read. */
@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final MessageService messages;
    private final PresenceService presence;
    private final ConversationMemberRepository members;

    public record WsSendPayload(
            UUID conversationId,
            String content,
            MessageType type,
            UUID replyToId,
            List<UUID> attachmentIds) {
    }

    public record WsTypingPayload(UUID conversationId, boolean typing) {
    }

    public record WsReadPayload(UUID conversationId, UUID messageId) {
    }

    @MessageMapping("/chat.send")
    public void send(WsSendPayload payload, SimpMessageHeaderAccessor headers) {
        UUID userId = principal(headers);
        messages.send(userId, payload.conversationId(), new SendMessageRequest(
                payload.content(), payload.type(), payload.replyToId(), payload.attachmentIds()));
    }

    @MessageMapping("/chat.typing")
    public void typing(WsTypingPayload payload, SimpMessageHeaderAccessor headers) {
        UUID userId = principal(headers);
        if (payload.conversationId() == null) {
            return;
        }
        if (!members.existsByConversationIdAndUserId(payload.conversationId(), userId)) {
            return;
        }
        presence.broadcastTyping(payload.conversationId(), userId, payload.typing());
    }

    @MessageMapping("/chat.read")
    public void read(@Valid WsReadPayload payload, SimpMessageHeaderAccessor headers) {
        UUID userId = principal(headers);
        messages.markRead(userId, payload.conversationId(), new MarkReadRequest(payload.messageId()));
    }

    private UUID principal(SimpMessageHeaderAccessor headers) {
        if (headers.getUser() instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof UUID id) {
            return id;
        }
        throw new IllegalStateException("Not authenticated");
    }
}
