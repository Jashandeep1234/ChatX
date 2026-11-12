"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMessages } from "@/hooks/use-chat-queries";
import { dateSeparatorLabel } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/store/auth-store";
import { typingUserIds, useChatStore } from "@/lib/store/chat-store";
import { ErrorState } from "@/components/common/states";
import { UserAvatar } from "@/components/common/user-avatar";
import { MessageBubble, useReplyJump } from "@/components/chat/message-bubble";
import type { ChatMessage } from "@/types";

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function MessageList({
  conversationId,
  optimistic,
  isGroup,
  members,
  unreadCount = 0,
  onReply,
  onEdit,
  onDelete,
  onRetry,
  onVisibleLast,
}: {
  conversationId: string;
  optimistic: ChatMessage[];
  isGroup?: boolean;
  members?: { userId: string; name?: string | null; avatarUrl: string | null }[];
  unreadCount?: number;
  onReply: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage) => void;
  onDelete: (m: ChatMessage) => void;
  onRetry: (m: ChatMessage) => void;
  onVisibleLast: (m: ChatMessage) => void;
}) {
  const me = useAuthStore((s) => s.user);
  const query = useMessages(conversationId);
  const jumpTo = useReplyJump();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef<number>(0);

  const serverMessages: ChatMessage[] = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const flat = pages.flatMap((p) => p.messages);
    const map = new Map<string, ChatMessage>();
    for (const m of flat) map.set(m.id, { ...m });
    return [...map.values()].sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
    );
  }, [query.data]);

  const all = useMemo(() => {
    const byIdMerge = new Map(serverMessages.map((m) => [m.id, m]));
    const extras: ChatMessage[] = [];
    for (const m of optimistic) {
      const key = m.tempId ?? m.id;
      if (byIdMerge.has(m.id)) {
        byIdMerge.set(m.id, { ...byIdMerge.get(m.id), ...m });
      } else if ([...byIdMerge.keys()].includes(key)) {
        continue;
      } else {
        extras.push(m);
      }
    }
    return [...byIdMerge.values(), ...extras].sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
    );
  }, [serverMessages, optimistic]);

  const byId = useMemo(() => new Map(all.map((m) => [m.id, m])), [all]);

  const avatarByUser = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const m of members ?? []) map.set(m.userId, m.avatarUrl);
    return map;
  }, [members]);

  const nameByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members ?? []) map.set(m.userId, m.name ?? "Someone");
    return map;
  }, [members]);

  const typingMap = useChatStore((s) => s.typingByConversation);
  const typingIds = typingUserIds(typingMap, conversationId, me?.id);
  const typingLabel =
    typingIds.length === 0
      ? ""
      : typingIds.length === 1
        ? `${nameByUser.get(typingIds[0]) ?? "Someone"} is typing…`
        : typingIds.length === 2
          ? `${nameByUser.get(typingIds[0]) ?? "Someone"} and ${nameByUser.get(typingIds[1]) ?? "Someone"} are typing…`
          : `${nameByUser.get(typingIds[0]) ?? "Someone"} and ${typingIds.length - 1} others are typing…`;
  const firstTyperId = typingIds[0];

  useEffect(() => {
    if (typingIds.length === 0) return;
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [typingIds.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevHeight.current && el.scrollHeight > prevHeight.current) {
      const delta = el.scrollHeight - prevHeight.current;
      if (!stickToBottom.current) el.scrollTop += delta;
    }
    prevHeight.current = el.scrollHeight;
  }, [all.length]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          query.hasNextPage &&
          !query.isFetchingNextPage
        ) {
          prevHeight.current = root.scrollHeight;
          stickToBottom.current = false;
          void query.fetchNextPage();
        }
      },
      { root, threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.hasNextPage, query.isFetchingNextPage, conversationId]);

  const lastId = all[all.length - 1]?.id;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom.current && lastId) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastId, conversationId]);

  useEffect(() => {
    const newest = [...all].reverse().find((m) => m.senderId !== me?.id && !m.deleted && !m.pending);
    if (newest && stickToBottom.current) {
      const t = window.setTimeout(() => onVisibleLast(newest), 800);
      return () => window.clearTimeout(t);
    }
  // onVisibleLast is a stable callback from parent; intentionally omitted to avoid re-subscribing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, conversationId, me?.id, all]);

  useEffect(() => {
    stickToBottom.current = true;
    prevHeight.current = 0;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [conversationId]);

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [conversationId, all.length]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    stickToBottom.current = nearBottom;
    setShowJump(!nearBottom);
  }

  if (query.isPending) {
    return (
      <div className="chat-canvas flex flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-5" aria-label="Loading messages">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`anim-fade-up flex ${i % 2 ? "justify-start" : "justify-end"}`} style={{ animationDelay: `${i * 50}ms` }}>
            <Skeleton
              className={`skeleton-shimmer h-12 rounded-lg ${i % 2 ? "w-1/2 rounded-bl-sm" : "w-2/5 rounded-br-sm bg-acid/10"}`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex-1 overflow-auto">
        <ErrorState
          title="Could not load messages"
          description="Check your connection and try again."
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <div className="chat-canvas flex flex-1 items-center justify-center overflow-auto p-6 sm:p-8">
        <div className="surface-elevated max-w-sm rounded-xl p-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-xl bg-acid text-coal shadow-[0_0_28px_rgba(213,244,91,0.4)]">
            <span className="text-2xl">✦</span>
          </span>
          <p className="mt-4 font-display text-lg font-black uppercase tracking-tight text-foreground">Start the conversation</p>
          <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">
            Say hello — duplex streaming is live with instantaneous receipts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-canvas relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full touch-pan-y overflow-y-auto overscroll-contain px-2 py-4 sm:px-4 sm:py-5"
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        <div ref={contentRef}>
          <div ref={topSentinelRef} aria-hidden className="h-1" />
          {query.isFetchingNextPage ? (
            <p className="py-1 text-center font-mono text-[11px] text-muted-foreground">
              Loading older messages…
            </p>
          ) : null}
          {all.map((m, idx) => {
            const prev = all[idx - 1];
            const showDate = !prev || dayKey(m.createdAt) !== dayKey(prev.createdAt);
            const gap = prev ? +new Date(m.createdAt) - +new Date(prev.createdAt) : Infinity;
            const grouped =
              !showDate &&
              prev !== undefined &&
              m.senderId === prev.senderId &&
              gap < 5 * 60 * 1000;
            const mine = m.senderId === me?.id;
            return (
              <div key={m.tempId ?? m.id}>
                {showDate ? (
                  <div className="sticky top-2 z-10 flex justify-center py-2.5">
                    <span className="rounded-full border border-slate-200/90 bg-white/95 px-4 py-1 font-mono text-[10px] font-bold text-slate-500 shadow-xs backdrop-blur dark:border-[#392B33] dark:bg-[#21191D]/95 dark:text-[#B9AAB0]">
                      {dateSeparatorLabel(m.createdAt)}
                    </span>
                  </div>
                ) : null}
                <div className={grouped ? "-mt-0.5" : "mt-3"}>
                  <MessageBubble
                    message={m}
                    mine={mine}
                    showSender={!mine && !grouped}
                    showAvatar={!mine && !grouped}
                    senderAvatarUrl={
                      m.senderId ? (avatarByUser.get(m.senderId) ?? null) : null
                    }
                    isGroup={isGroup ?? true}
                    replyPreview={m.replyToId ? (byId.get(m.replyToId) ?? null) : null}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRetry={onRetry}
                    onJumpToReply={jumpTo}
                    onPreviewImage={(url, name) => setLightbox({ url, name })}
                  />
                </div>
              </div>
            );
          })}
          <div className="h-2" />
        </div>
        {typingIds.length > 0 ? (
          <div className="anim-msg flex items-end gap-2 px-3 pb-3 sm:px-4" aria-live="polite">
            <UserAvatar
              name={nameByUser.get(firstTyperId) ?? "Someone"}
              avatarUrl={firstTyperId ? (avatarByUser.get(firstTyperId) ?? null) : null}
              size="sm"
              className="shrink-0"
            />
            <span className="flex items-center gap-2 rounded-lg rounded-bl-sm border border-border bg-card px-3.5 py-2 shadow-sm">
              <span className="flex items-center gap-1" aria-hidden>
                <span className="typing-dot bg-signal" />
                <span className="typing-dot bg-signal" />
                <span className="typing-dot bg-signal" />
              </span>
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {typingLabel}
              </span>
            </span>
          </div>
        ) : null}
      </div>

      {showJump ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-sm"
                aria-label={unreadCount > 0 ? `Scroll to bottom, ${unreadCount} unread` : "Scroll to bottom"}
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) {
                    stickToBottom.current = true;
                    el.scrollTop = el.scrollHeight;
                    setShowJump(false);
                  }
                }}
                className="absolute right-5 bottom-5 flex size-10 items-center justify-center border-0 bg-coal text-bone shadow-md interactive-press"
              >
                <ArrowDown className="size-4 text-acid" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="left" className="font-mono text-xs">
            {unreadCount > 0 ? `${unreadCount} new messages` : "Jump to latest"}
          </TooltipContent>
        </Tooltip>
      ) : null}
      {showJump && unreadCount > 0 ? (
        <Badge className="absolute right-3 bottom-14 h-5 min-w-5 border-0 bg-signal px-1.5 font-mono text-[10px] font-black text-bone tabular-nums shadow-md">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      ) : null}

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-3xl rounded-xl border-border bg-card p-0 shadow-2xl">
          <DialogTitle className="sr-only">{lightbox?.name ?? "Image"}</DialogTitle>
          {lightbox ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.url}
              alt={lightbox.name}
              className="max-h-[75vh] w-full rounded-t-xl object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}