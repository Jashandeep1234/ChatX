"use client";

import { ArrowLeft, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useChatStore, typingUserIds } from "@/lib/store/chat-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { UserAvatar } from "@/components/common/user-avatar";
import type { ConversationResponse } from "@/types";

function titleOf(c: ConversationResponse, meId?: string | null): string {
  if (c.type === "GROUP") return c.name ?? "Group";
  if (c.name) return c.name;
  return c.members.find((m) => m.userId !== meId)?.name ?? "Direct chat";
}

export function ChatHeader({
  conversation,
  onInfo,
  showBack,
}: {
  conversation: ConversationResponse;
  onInfo: () => void;
  showBack?: boolean;
}) {
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const typingMap = useChatStore((s) => s.typingByConversation);
  const onlineMap = useChatStore((s) => s.onlineUsers);
  const typing = typingUserIds(typingMap, conversation.id, me?.id);

  const others = conversation.members.filter((m) => m.userId !== me?.id);
  const online =
    conversation.type === "GROUP"
      ? others.some((m) => onlineMap[m.userId] ?? m.online)
      : (onlineMap[others[0]?.userId ?? ""] ?? others[0]?.online ?? false);

  const nameById = new Map(conversation.members.map((m) => [m.userId, m.name]));
  const typingNames = typing
    .map((id) => nameById.get(id) ?? "Someone")
    .slice(0, 2);
  const typingText =
    typingNames.length === 0
      ? ""
      : typingNames.length === 1
        ? `${typingNames[0]} is typing…`
        : typing.length > 2
          ? `${typingNames[0]}, ${typingNames[1]} and ${typing.length - 2} more are typing…`
          : `${typingNames[0]} and ${typingNames[1]} are typing…`;

  const subtitle =
    typing.length > 0
      ? typingText
      : conversation.type === "GROUP"
        ? `${conversation.members.length} members · ${others.filter((m) => onlineMap[m.userId] ?? m.online).length} online`
        : online
          ? "Online"
          : "Offline";

  const stack = conversation.members.slice(0, 3);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-card/95 px-3 py-3 shadow-sm backdrop-blur-md sm:gap-3 sm:px-6">
      {showBack ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to conversations"
          onClick={() => router.push("/chat")}
          className="sm:hidden interactive-press"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
      ) : null}

      {conversation.type === "GROUP" ? (
        <span
          className="rounded-md border border-border bg-elevated p-0.5 shadow-sm"
          aria-hidden
        >
          <span className="flex -space-x-2 rounded-md p-0.5">
            {stack.map((m) => (
              <UserAvatar
                key={m.userId}
                name={m.name}
                avatarUrl={m.avatarUrl}
                size="sm"
                className="ring-2 ring-card"
              />
            ))}
          </span>
        </span>
      ) : (
        <UserAvatar
          name={titleOf(conversation, me?.id)}
          avatarUrl={conversation.avatarUrl ?? others[0]?.avatarUrl ?? null}
          online={online}
        />
      )}

      <div className="min-w-0 flex-1 leading-tight">
        <p className="flex items-center gap-2 truncate font-display text-base font-black uppercase tracking-tight text-foreground">
          <span className="truncate">{titleOf(conversation, me?.id)}</span>
          {conversation.type === "GROUP" ? (
            <span className="hidden shrink-0 rounded-full border border-slate-200/90 bg-slate-100 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-600 sm:inline dark:border-[#392B33] dark:bg-[#151115] dark:text-[#B9AAB0]">
              {conversation.members.length} members
            </span>
          ) : null}
        </p>
        <p
          className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] font-medium text-muted-foreground"
          aria-live="polite"
        >
          {typing.length > 0 ? (
            <span className="flex items-center gap-1.5 font-bold text-signal">
              <span className="flex items-center gap-0.5" aria-hidden>
                <span className="typing-dot bg-signal" />
                <span className="typing-dot bg-signal" />
                <span className="typing-dot bg-signal" />
              </span>
              <span className="truncate">{typingText}</span>
            </span>
          ) : (
            <>
              <span
                aria-hidden
                className={`size-1.5 shrink-0 rounded-full ${
                  online
                    ? "bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span className="truncate">{subtitle}</span>
            </>
          )}
        </p>
      </div>

      {conversation.type === "GROUP" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onInfo}
          aria-label="Group info"
          className="gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#21191D] hover:bg-slate-50 dark:border-[#392B33] dark:bg-[#21191D] dark:text-[#F5EEDC] dark:hover:bg-[#2B2027] interactive-press"
        >
          <Info className="size-3.5 text-signal" aria-hidden />
          <span className="hidden md:inline">Group Info</span>
        </Button>
      ) : null}
    </header>
  );
}
