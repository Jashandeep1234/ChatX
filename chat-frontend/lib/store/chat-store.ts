import { create } from "zustand";
import type { MessageResponse } from "@/types";

interface ChatState {
  activeConversationId: string | null;
  typingByConversation: Record<string, Record<string, number>>;
  onlineUsers: Record<string, boolean>;
  replyTo: MessageResponse | null;
  setActiveConversationId: (id: string | null) => void;
  setTyping: (conversationId: string, userId: string, typing: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
  setReplyTo: (m: MessageResponse | null) => void;
  clearTyping: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  typingByConversation: {},
  onlineUsers: {},
  replyTo: null,
  setActiveConversationId: (id) =>
    set({ activeConversationId: id, replyTo: null }),
  setTyping: (conversationId, userId, typing) =>
    set((s) => {
      const prev = s.typingByConversation[conversationId] ?? {};
      if (typing) {
        return {
          typingByConversation: {
            ...s.typingByConversation,
            [conversationId]: { ...prev, [userId]: Date.now() },
          },
        };
      }
      const next = { ...prev };
      delete next[userId];
      return {
        typingByConversation: {
          ...s.typingByConversation,
          [conversationId]: next,
        },
      };
    }),
  setOnline: (userId, online) =>
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: online } })),
  setReplyTo: (m) => set({ replyTo: m }),
  clearTyping: (conversationId) =>
    set((s) => ({
      typingByConversation: {
        ...s.typingByConversation,
        [conversationId]: {},
      },
    })),
}));

export function typingUserIds(
  typingByConversation: Record<string, Record<string, number>>,
  conversationId: string,
  excludeUserId?: string | null
): string[] {
  const bucket = typingByConversation[conversationId] ?? {};
  const cutoff = Date.now() - 6000;
  return Object.entries(bucket)
    .filter(
      ([uid, ts]) => ts > cutoff && (!excludeUserId || uid !== excludeUserId)
    )
    .map(([uid]) => uid);
}
