package com.chat.Backend.websocket;

import com.chat.Backend.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.UUID;

/**
 * Updates is_online / last_seen_at on WS connect/disconnect
 * and broadcasts USER_ONLINE / USER_OFFLINE presence.
 */
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presence;

    @EventListener
    public void onConnect(SessionConnectedEvent event) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
        UUID userId = principal(acc);
        if (userId != null) {
            presence.connected(acc.getSessionId(), userId);
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presence.disconnected(event.getSessionId());
    }

    private UUID principal(StompHeaderAccessor acc) {
        if (acc.getUser() instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof UUID id) {
            return id;
        }
        return null;
    }
}
