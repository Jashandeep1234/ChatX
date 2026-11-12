package com.chat.Backend.websocket;

import com.chat.Backend.repository.ConversationMemberRepository;
import com.chat.Backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Validates the JWT on STOMP CONNECT and stores the userId as Principal.
 * Verifies conversation membership on SUBSCRIBE to /topic/conversation/{id}.
 */
@Component
@RequiredArgsConstructor
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final ConversationMemberRepository members;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null || acc.getCommand() == null) {
            return message;
        }

        if (acc.getCommand() == StompCommand.CONNECT) {
            UUID userId = resolveUser(acc);
            if (userId == null) {
                throw new MessagingException("Missing or invalid JWT");
            }
            acc.setUser(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
        } else if (acc.getCommand() == StompCommand.SUBSCRIBE) {
            UUID userId = principalOf(acc);
            if (userId == null) {
                throw new MessagingException("Not authenticated");
            }
            // Keep auth on subsequent frames of this session
            acc.setUser(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
            String dest = acc.getDestination();
            if (dest != null && dest.startsWith("/topic/conversation/")) {
                UUID convId = lastPathId(dest);
                if (convId == null || !members.existsByConversationIdAndUserId(convId, userId)) {
                    throw new MessagingException("Not a member of this conversation");
                }
            }
        } else if (acc.getCommand() == StompCommand.SEND) {
            // Re-attach principal so @MessageMapping handlers can read it
            UUID userId = principalOf(acc);
            if (userId != null) {
                acc.setUser(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
            }
        }
        return message;
    }

    private UUID resolveUser(StompHeaderAccessor acc) {
        String header = acc.getFirstNativeHeader("Authorization");
        if (header == null) {
            header = acc.getFirstNativeHeader("token");
        }
        String token = null;
        if (header != null) {
            token = header.startsWith("Bearer ") ? header.substring(7) : header;
        }
        if (token == null || token.isBlank() || !jwtService.valid(token)) {
            return null;
        }
        try {
            return jwtService.userIdOf(token);
        } catch (Exception e) {
            return null;
        }
    }

    private UUID principalOf(StompHeaderAccessor acc) {
        if (acc.getUser() instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof UUID id) {
            return id;
        }
        // Fallback: token may be resent on SUBSCRIBE by some clients
        return resolveUser(acc);
    }

    private UUID lastPathId(String dest) {
        try {
            String[] parts = dest.split("/");
            return UUID.fromString(parts[parts.length - 1]);
        } catch (Exception e) {
            return null;
        }
    }
}
