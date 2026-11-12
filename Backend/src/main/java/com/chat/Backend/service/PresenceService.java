package com.chat.Backend.service;

import com.chat.Backend.entity.User;
import com.chat.Backend.repository.UserRepository;
import com.chat.Backend.websocket.WsEvent;
import com.chat.Backend.websocket.WsEventType;
import com.chat.Backend.websocket.WsSessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Owns online/offline state. First connect marks online, last disconnect
 * stamps last_seen_at and marks offline; both broadcast on /topic/presence.
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final WsSessionRegistry sessions;
    private final UserRepository users;
    private final SimpMessagingTemplate broker;

    @Transactional
    public void connected(String sessionId, UUID userId) {
        boolean first = sessions.add(sessionId, userId);
        if (!first) {
            return;
        }
        users.findById(userId).ifPresent(u -> {
            u.setOnline(true);
            users.save(u);
            broker.convertAndSend("/topic/presence",
                    WsEvent.of(WsEventType.USER_ONLINE, null, userId, Map.of("userId", userId)));
        });
    }

    @Transactional
    public void disconnected(String sessionId) {
        WsSessionRegistry.Disconnect d = sessions.remove(sessionId);
        if (d == null || !d.wentOffline()) {
            return;
        }
        users.findById(d.userId()).ifPresent(u -> {
            u.setOnline(false);
            u.setLastSeenAt(Instant.now());
            users.save(u);
            broker.convertAndSend("/topic/presence",
                    WsEvent.of(WsEventType.USER_OFFLINE, null, d.userId(),
                            Map.of("userId", d.userId(), "lastSeenAt", u.getLastSeenAt().toString())));
        });
    }

    public void broadcastTyping(UUID conversationId, UUID userId, boolean typing) {
        broker.convertAndSend("/topic/conversation/" + conversationId,
                WsEvent.of(WsEventType.TYPING, conversationId, userId,
                        Map.of("userId", userId, "typing", typing)));
    }

    public void sendToConversation(UUID conversationId, WsEvent event) {
        broker.convertAndSend("/topic/conversation/" + conversationId, event);
    }

    public void sendToUser(UUID userId, WsEvent event) {
        broker.convertAndSendToUser(userId.toString(), "/queue/messages", event);
    }

    // Helper for read-receipt broadcasts that need the user entity inline
    public User getUser(UUID id) {
        return users.findById(id).orElse(null);
    }
}
