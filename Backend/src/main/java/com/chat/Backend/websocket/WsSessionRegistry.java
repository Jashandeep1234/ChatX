package com.chat.Backend.websocket;

import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Counts active STOMP sessions per user so presence (online/offline)
 * reflects "has at least one open tab" instead of last socket only.
 */
@Component
public class WsSessionRegistry {

    private final ConcurrentHashMap<UUID, AtomicInteger> counts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UUID> sessionOwners = new ConcurrentHashMap<>();

    /** @return true if this is the user's first active session */
    public boolean add(String sessionId, UUID userId) {
        sessionOwners.put(sessionId, userId);
        return counts.computeIfAbsent(userId, k -> new AtomicInteger(0)).incrementAndGet() == 1;
    }

    /** @return the owner, plus whether they went fully offline */
    public record Disconnect(UUID userId, boolean wentOffline) {
    }

    public Disconnect remove(String sessionId) {
        UUID userId = sessionOwners.remove(sessionId);
        if (userId == null) {
            return null;
        }
        AtomicInteger n = counts.get(userId);
        if (n == null) {
            return new Disconnect(userId, true);
        }
        int left = n.decrementAndGet();
        if (left <= 0) {
            counts.remove(userId);
            return new Disconnect(userId, true);
        }
        return new Disconnect(userId, false);
    }

    public boolean isOnline(UUID userId) {
        AtomicInteger n = counts.get(userId);
        return n != null && n.get() > 0;
    }
}
