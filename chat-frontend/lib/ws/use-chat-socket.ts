"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { stompSingleton } from "@/lib/ws/stomp-client";
import type {
  ConversationResponse,
  MessageResponse,
  MessageReadPayload,
  TypingPayload,
  WsEvent,
} from "@/types";
import { WsEventType } from "@/types";

function upsertConversation(
  qc: ReturnType<typeof useQueryClient>,
  conv: ConversationResponse
) {
  qc.setQueryData<ConversationResponse[]>(["conversations"], (old) => {
    if (!old) return [conv];
    const idx = old.findIndex((c) => c.id === conv.id);
    if (idx < 0) return [conv, ...old];
    const next = [...old];
    next[idx] = conv;
    return next.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  });
  qc.setQueryData<ConversationResponse>(["conversation", conv.id], conv);
}

/**
 * Global socket lifecycle:
 * - connects with JWT in CONNECT headers, auto-reconnect with backoff
 * - subscribes to /user/queue/messages + /topic/conversation/{id} + presence
 * - patches TanStack Query cache + Zustand on every event
 * - on reconnect, refetches conversations + active history (handled by callers via `connected` flips)
 */
export function useChatSocket(conversationIds: string[]) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    stompSingleton.connect();
    return () => {
      // keep singleton alive across screens; disconnect only on logout
    };
  }, [accessToken]);

  useEffect(() => {
    stompSingleton.subscribeConversations(conversationIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationIds.join("|")]);

  // On every (re)connect, refetch conversations + histories to catch missed events.
  useEffect(() => {
    const off = stompSingleton.onConnect(() => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      const active = useChatStore.getState().activeConversationId;
      if (active) {
        void qc.invalidateQueries({ queryKey: ["messages", active] });
        void qc.invalidateQueries({ queryKey: ["conversation", active] });
      } else {
        for (const id of conversationIds) {
          void qc.invalidateQueries({ queryKey: ["messages", id] });
        }
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc]);

  useEffect(() => {
    const off = stompSingleton.onEvent((ev: WsEvent) => {
      const set = useChatStore.getState();
      switch (ev.type) {
        case WsEventType.MESSAGE_NEW: {
          const m = ev.payload as MessageResponse;
          void qc.invalidateQueries({ queryKey: ["messages", m.conversationId] });
          void qc.invalidateQueries({ queryKey: ["conversations"] });
          break;
        }
        case WsEventType.MESSAGE_EDITED: {
          const m = ev.payload as MessageResponse;
          void qc.invalidateQueries({ queryKey: ["messages", m.conversationId] });
          break;
        }
        case WsEventType.MESSAGE_DELETED: {
          const payload = ev.payload as { messageId: string; conversationId: string };
          void qc.invalidateQueries({
            queryKey: ["messages", payload.conversationId],
          });
          break;
        }
        case WsEventType.MESSAGE_READ: {
          const p = ev.payload as MessageReadPayload;
          void qc.invalidateQueries({ queryKey: ["messages", p.conversationId] });
          break;
        }
        case WsEventType.TYPING: {
          const p = ev.payload as TypingPayload;
          const cid = ev.conversationId;
          if (cid) set.setTyping(cid, p.userId, p.typing);
          break;
        }
        case WsEventType.USER_ONLINE:
        case WsEventType.USER_OFFLINE: {
          const p = ev.payload as { userId: string };
          set.setOnline(
            p.userId,
            ev.type === WsEventType.USER_ONLINE
          );
          break;
        }
        case WsEventType.GROUP_UPDATED:
        case WsEventType.MEMBER_ADDED:
        case WsEventType.MEMBER_REMOVED: {
          const conv = ev.payload as ConversationResponse;
          if (conv?.id) upsertConversation(qc, conv);
          else void qc.invalidateQueries({ queryKey: ["conversations"] });
          break;
        }
        default:
          break;
      }
    });
    return off;
  }, [qc]);
}

export function sendTyping(conversationId: string, typing: boolean) {
  stompSingleton.send("/app/chat.typing", { conversationId, typing });
}

export function sendReadReceipt(conversationId: string, messageId: string) {
  stompSingleton.send("/app/chat.read", { conversationId, messageId });
}
