"use client";

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { env } from "@/lib/env";
import { useAuthStore } from "@/lib/store/auth-store";
import type { WsEvent } from "@/types";

type Handler = (event: WsEvent) => void;

class StompSingleton {
  private client: Client | null = null;
  private handlers = new Set<Handler>();
  private connectHandlers = new Set<() => void>();
  private subs: StompSubscription[] = [];
  private conversations = new Set<string>();
  private backoffMs = 1000;
  private started = false;

  onEvent(h: Handler): () => void {
    this.handlers.add(h);
    return () => {
      this.handlers.delete(h);
    };
  }

  /** Fired on every (re)connect — callers refetch missed state here. */
  onConnect(h: () => void): () => void {
    this.connectHandlers.add(h);
    return () => {
      this.connectHandlers.delete(h);
    };
  }

  private emit(ev: WsEvent) {
    for (const h of this.handlers) {
      try {
        h(ev);
      } catch {
        // ignore handler errors
      }
    }
  }

  connect() {
    if (typeof window === "undefined") return;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    if (this.client?.active) {
      this.refreshToken();
      return;
    }

    this.started = true;
    const c = new Client({
      webSocketFactory: () => new SockJS(env.wsUrl) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0, // manual exponential backoff below
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.backoffMs = 1000;
        this.resubscribe();
        for (const h of this.connectHandlers) {
          try {
            h();
          } catch {
            // ignore handler errors
          }
        }
      },
      onStompError: () => {
        this.scheduleReconnect();
      },
      onWebSocketClose: () => {
        if (this.started) this.scheduleReconnect();
      },
    });
    c.onUnhandledMessage = () => undefined;
    this.client = c;
    c.activate();
  }

  private scheduleReconnect() {
    if (!this.started) return;
    if (typeof window === "undefined") return;
    const delay = Math.min(this.backoffMs, 30000);
    this.backoffMs = Math.min(this.backoffMs * 2, 30000);
    window.setTimeout(() => {
      if (!this.started) return;
      try {
        this.client?.deactivate();
      } catch {
        // ignore
      }
      this.client = null;
      this.connect();
    }, delay);
  }

  /** Re-authenticate the socket after a token refresh. */
  refreshToken() {
    const token = useAuthStore.getState().accessToken;
    if (!token || !this.client) return;
    try {
      // STOMP.js keeps CONNECT headers; easiest reliable re-auth is reconnect.
      void this.client.deactivate().finally(() => {
        this.client = null;
        this.connect();
      });
    } catch {
      // ignore
    }
  }

  disconnect() {
    this.started = false;
    this.subs.forEach((s) => {
      try {
        s.unsubscribe();
      } catch {
        // ignore
      }
    });
    this.subs = [];
    try {
      void this.client?.deactivate();
    } catch {
      // ignore
    }
    this.client = null;
  }

  subscribeConversations(ids: string[]) {
    this.conversations = new Set(ids);
    if (this.client?.connected) this.resubscribe();
  }

  private resubscribe() {
    const c = this.client;
    if (!c || !c.connected) return;
    this.subs.forEach((s) => {
      try {
        s.unsubscribe();
      } catch {
        // ignore
      }
    });
    this.subs = [];
    const onMsg = (m: IMessage) => {
      try {
        const ev = JSON.parse(m.body) as WsEvent;
        this.emit(ev);
      } catch {
        // ignore malformed
      }
    };
    try {
      this.subs.push(c.subscribe("/user/queue/messages", onMsg));
      this.subs.push(c.subscribe("/topic/presence", onMsg));
      for (const id of this.conversations) {
        this.subs.push(c.subscribe(`/topic/conversation/${id}`, onMsg));
      }
    } catch {
      // ignore
    }
  }

  send(destination: string, body: unknown) {
    try {
      this.client?.publish({ destination, body: JSON.stringify(body) });
    } catch {
      // ignore when offline; REST fallback covers sending
    }
  }

  get connected(): boolean {
    return !!this.client?.connected;
  }
}

export const stompSingleton = new StompSingleton();
