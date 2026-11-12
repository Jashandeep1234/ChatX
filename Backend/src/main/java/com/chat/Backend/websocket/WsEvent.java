package com.chat.Backend.websocket;

import java.time.Instant;
import java.util.UUID;

/** Envelope broadcast on /topic/conversation/{id}, /topic/presence and /user/queue/messages. */
public record WsEvent(
        String type,
        UUID conversationId,
        UUID actorId,
        Object payload,
        Instant at) {

    public static WsEvent of(String type, UUID conversationId, UUID actorId, Object payload) {
        return new WsEvent(type, conversationId, actorId, payload, Instant.now());
    }
}
