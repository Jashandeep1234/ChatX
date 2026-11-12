"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";
import { GroupInfoSheet } from "@/components/group/group-info-sheet";
import {
  useConversation,
  useConversations,
  useDeleteMessage,
  useEditMessage,
  useMarkRead,
} from "@/hooks/use-chat-queries";
import { sendMessage } from "@/lib/api/messages";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { sendReadReceipt } from "@/lib/ws/use-chat-socket";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import type { AttachmentResponse, ChatMessage } from "@/types";

export function ChatPanel({ conversationId }: { conversationId: string }) {
  const me = useAuthStore((s) => s.user);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const setActive = useChatStore((s) => s.setActiveConversationId);
  const clearTyping = useChatStore((s) => s.clearTyping);
  const convQuery = useConversation(conversationId);
  const convsQuery = useConversations();
  const editMutation = useEditMessage(conversationId);
  const deleteMutation = useDeleteMessage(conversationId);
  const markReadMutation = useMarkRead(conversationId);
  const markReadRef = useRef(markReadMutation.mutate);
  useEffect(() => {
    markReadRef.current = markReadMutation.mutate;
  });
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const [prevConvId, setPrevConvId] = useState(conversationId);
  const [infoOpen, setInfoOpen] = useState(false);

  if (conversationId !== prevConvId) {
    setPrevConvId(conversationId);
    setOptimistic([]);
  }

  // setActive syncs to an external Zustand store (not React state).
  useEffect(() => {
    setActive(conversationId);
    return () => {
      clearTyping(conversationId);
      setActive(null);
    };
  }, [conversationId, setActive, clearTyping]);

  const conversation =
    convQuery.data ??
    convsQuery.data?.find((c) => c.id === conversationId) ??
    null;

  const markVisible = useCallback(
    (m: ChatMessage) => {
      if (!me || m.senderId === me.id || m.deleted) return;
      sendReadReceipt(conversationId, m.id);
      markReadRef.current(m.id, {
        onError: () => undefined, // receipts are best-effort
      });
    },
    [conversationId, me]
  );

  async function handleSend(input: {
    content: string;
    replyToId: string | null;
    attachments: AttachmentResponse[];
  }) {
    if (!me) return;
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const pending: ChatMessage = {
      id: tempId,
      tempId,
      conversationId,
      senderId: me.id,
      senderName: me.name,
      content: input.content,
      messageType: input.attachments.some((a) =>
        a.mimeType.startsWith("image/")
      )
        ? "IMAGE"
        : input.attachments.length
          ? "FILE"
          : "TEXT",
      status: "SENT",
      replyToId: input.replyToId,
      attachments: input.attachments,
      deleted: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setOptimistic((prev) => [...prev, pending]);
    try {
      const saved = await sendMessage(conversationId, {
        content: input.content || undefined,
        type: pending.messageType,
        replyToId: input.replyToId,
        // Backend expects attachment IDs (UUIDs).
        attachmentIds: input.attachments.map((a) => a.id),
        attachments: input.attachments,
      });
      // Reconcile: drop pending, let invalidation bring the ack.
      // The server echo may lack local object-URL attachments,
      // so keep them on the reconciled copy.
      const reconciled: ChatMessage = {
        ...saved,
        attachments:
          saved.attachments?.length > 0
            ? saved.attachments
            : input.attachments,
      };
      void reconciled;
      setOptimistic((prev) => prev.filter((m) => m.tempId !== tempId));
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch (e) {
      setOptimistic((prev) =>
        prev.map((m) =>
          m.tempId === tempId ? { ...m, pending: false, failed: true } : m
        )
      );
      throw e;
    }
  }

  async function handleRetry(m: ChatMessage) {
    const key = m.tempId ?? m.id;
    setOptimistic((prev) =>
      prev.map((x) =>
        (x.tempId ?? x.id) === key ? { ...x, failed: false, pending: true } : x
      )
    );
    try {
      await sendMessage(conversationId, {
        content: m.content ?? undefined,
        replyToId: m.replyToId,
      });
      setOptimistic((prev) =>
        prev.filter((x) => (x.tempId ?? x.id) !== key)
      );
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch {
      setOptimistic((prev) =>
        prev.map((x) =>
          (x.tempId ?? x.id) === key
            ? { ...x, pending: false, failed: true }
            : x
        )
      );
      toast.error("Retry failed. Check your connection.");
    }
  }

  async function handleEdit(m: ChatMessage) {
    try {
      await editMutation.mutateAsync({ id: m.id, content: m.content ?? "" });
      toast.success("Message edited.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not edit message.");
    }
  }

  async function handleDelete(m: ChatMessage) {
    try {
      // Optimistic placeholder
      setOptimistic((prev) => [
        ...prev,
        { ...m, deleted: true, content: null, attachments: [] },
      ]);
      await deleteMutation.mutateAsync(m.id);
      setOptimistic((prev) => prev.filter((x) => x.id !== m.id && x.tempId !== m.id));
    } catch (e) {
      setOptimistic((prev) => prev.filter((x) => x.id !== m.id));
      toast.error(e instanceof Error ? e.message : "Could not delete message.");
    }
  }

  const headerConv = useMemo(() => conversation, [conversation]);

  if (convQuery.isPending && !headerConv) {
    return (
      <div
        className="chat-canvas flex h-full flex-col gap-3 p-4 sm:p-5"
        aria-label="Loading conversation"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 ? "justify-start" : "justify-end"}`}
          >
            <Skeleton
              className={`skeleton-shimmer h-12 rounded-xl ${
                i % 2
                  ? "w-1/2 rounded-bl-sm"
                  : "w-2/5 rounded-br-sm bg-acid/10"
              }`}
            />
          </div>
        ))}
      </div>
    );
  }
  if (convQuery.isError && !headerConv) {
    return (
      <ErrorState
        title="Could not open conversation"
        description="It may have been deleted, or you lost connection."
        onRetry={() => void convQuery.refetch()}
      />
    );
  }
  if (!headerConv) {
    return (
      <EmptyState
        title="Conversation not found"
        description="Pick another conversation from the list."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <ChatHeader
        conversation={headerConv}
        onInfo={() => setInfoOpen(true)}
        showBack
      />
      <MessageList
        conversationId={conversationId}
        optimistic={optimistic}
        isGroup={headerConv.type === "GROUP"}
        members={headerConv.members}
        unreadCount={headerConv.unreadCount}
        onReply={(m) => setReplyTo(m)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRetry={handleRetry}
        onVisibleLast={markVisible}
      />
      <MessageInput conversationId={conversationId} onSend={handleSend} />
      <GroupInfoSheet
        conversationId={
          headerConv.type === "GROUP" ? headerConv.id : null
        }
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </div>
  );
}
