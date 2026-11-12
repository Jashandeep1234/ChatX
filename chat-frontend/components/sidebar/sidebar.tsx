"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Loader2, Plus, Search, Settings2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedValue } from "@/hooks/use-debounce";
import {
  useConversations,
  useCreateDirect,
  useUserSearch,
} from "@/hooks/use-chat-queries";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore, typingUserIds } from "@/lib/store/chat-store";
import { formatConversationTime } from "@/lib/utils/format";
import { UserAvatar } from "@/components/common/user-avatar";
import { EmptyState, ErrorState } from "@/components/common/states";
import type { ConversationResponse } from "@/types";

function displayName(c: ConversationResponse, meId?: string | null): string {
  if (c.type === "GROUP") return c.name ?? "Group";
  if (c.name) return c.name;
  const other = c.members.find((m) => m.userId !== meId);
  return other?.name ?? "Direct chat";
}

function handleOf(c: ConversationResponse, meId?: string | null): string | null {
  if (c.type === "GROUP") return null;
  const other = c.members.find((m) => m.userId !== meId);
  return other?.username ? `@${other.username}` : null;
}

function otherOnline(c: ConversationResponse, meId?: string | null): boolean {
  if (c.type === "GROUP") return c.members.some((m) => m.online);
  const other = c.members.find((m) => m.userId !== meId);
  return other?.online ?? false;
}

export function NewChatDialog({ onOpen }: { onOpen?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 350);
  const me = useAuthStore((s) => s.user);
  const search = useUserSearch(debounced);
  const createDirect = useCreateDirect();
  const router = useRouter();
  const tooShort = debounced.trim().length < 2;
  const people = (search.data ?? []).filter((u) => u.id !== me?.id);

  useEffect(() => {
    function openDialog() {
      setOpen(true);
    }
    document.addEventListener("chatx-open-new-chat", openDialog);
    return () => document.removeEventListener("chatx-open-new-chat", openDialog);
  }, []);

  async function start(userId: string) {
    try {
      const conv = await createDirect.mutateAsync(userId);
      setOpen(false);
      setQ("");
      onOpen?.(conv.id);
      router.push(`/chat/${conv.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start chat.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        aria-label="Start new chat"
        onClick={() => setOpen(true)}
        className="h-10 flex-1 rounded-xl bg-coal text-bone hover:bg-coal/90 dark:bg-acid dark:text-coal dark:hover:bg-acid/90 font-mono text-[11px] font-bold uppercase tracking-wider shadow-sm"
      >
        <Plus className="size-4 text-acid dark:text-coal" aria-hidden /> New chat
      </Button>
      <DialogContent className="gap-4 overflow-hidden rounded-2xl p-0 sm:max-w-md border-border bg-card">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-display text-xl font-black uppercase tracking-tight">
            New chat
          </DialogTitle>
          <DialogDescription className="font-mono text-xs leading-relaxed">
            Search anyone by @username — e.g. @alex.chen — then say hello.
          </DialogDescription>
        </DialogHeader>
        <div className="px-3 pb-4">
          <Command
            label="Search users by username"
            shouldFilter={false}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <CommandInput
              placeholder="Try @alex…"
              value={q}
              onValueChange={setQ}
              className="bg-transparent"
            />
            <CommandList>
              {search.isPending && !tooShort ? (
                <div className="flex items-center gap-2 p-4 font-mono text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-signal" aria-hidden />
                  Searching handles…
                </div>
              ) : null}
              <CommandEmpty className="py-6 text-center font-mono text-xs text-muted-foreground">
                {tooShort
                  ? "Type at least 2 characters of a username."
                  : "No handle matches. Ask them to claim their username first."}
              </CommandEmpty>
              <CommandGroup heading="People">
                {people.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={u.id}
                    onSelect={() => void start(u.id)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-elevated data-selected:bg-elevated"
                  >
                    <UserAvatar
                      name={u.name}
                      avatarUrl={u.avatarUrl}
                      online={u.online}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {u.name}
                      </span>
                      <span className="flex items-center gap-1 truncate font-mono text-xs text-muted-foreground">
                        <AtSign className="size-3" aria-hidden />
                        {u.username ?? u.email}
                      </span>
                    </span>
                    {u.online ? (
                      <span className="size-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Tab = "all" | "unread" | "groups";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
];

export function Sidebar({ onSelect }: { onSelect?: (id: string) => void }) {
  const me = useAuthStore((s) => s.user);
  const activeId = useChatStore((s) => s.activeConversationId);
  const typingMap = useChatStore((s) => s.typingByConversation);
  const convs = useConversations();
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "/") return;
      const t = e.target;
      const typing =
        t instanceof HTMLElement &&
        (t.isContentEditable ||
          t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT");
      if (typing) return;
      e.preventDefault();
      document.getElementById("sidebar-search")?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const counts = useMemo(() => {
    const list = convs.data ?? [];
    return {
      all: list.length,
      unread: list.filter((c) => c.unreadCount > 0).length,
      groups: list.filter((c) => c.type === "GROUP").length,
    };
  }, [convs.data]);

  const items = useMemo(() => {
    let list = convs.data ?? [];
    if (tab === "unread") list = list.filter((c) => c.unreadCount > 0);
    if (tab === "groups") list = list.filter((c) => c.type === "GROUP");
    const f = filter.trim().toLowerCase();
    if (!f) return list;
    return list.filter((c) => {
      const hay =
        `${displayName(c, me?.id)} ${handleOf(c, me?.id) ?? ""} ${c.members.map((m) => `${m.name} ${m.username ? `@${m.username}` : ""}`).join(" ")}`.toLowerCase();
      return hay.includes(f);
    });
  }, [convs.data, filter, me?.id, tab]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      {/* Identity card */}
      <div className="p-3 pb-0">
        <button
          onClick={() =>
            document.dispatchEvent(new CustomEvent("chatx-open-profile"))
          }
          aria-label="Open your profile"
          className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3 text-left transition-all hover:border-slate-300 hover:bg-slate-100/80 dark:border-[#392B33] dark:bg-[#151115] dark:hover:border-[#482B36] interactive-press"
        >
          <UserAvatar
            name={me?.name}
            avatarUrl={me?.avatarUrl}
            online
            size="lg"
            className="shrink-0"
          />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="flex items-center gap-2">
              <span className="block truncate font-display text-sm font-black uppercase tracking-tight text-[#21191D] dark:text-[#F5EEDC]">
                {me?.name ?? "…"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-success">
                <span className="size-1 rounded-full bg-success" />
                Online
              </span>
            </span>
            <span className="mt-1 block truncate font-mono text-[11px] text-slate-500 dark:text-[#B9AAB0]">
              {me?.username ? `@${me.username}` : (me?.email ?? "Realtime")}
            </span>
          </span>
          <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-slate-200/90 bg-white text-slate-500 transition-colors group-hover:border-acid/60 group-hover:text-coal dark:border-[#392B33] dark:bg-[#21191D] dark:text-[#B9AAB0] dark:group-hover:text-bone">
            <Settings2 className="size-4" aria-hidden />
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="sidebar-search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && filter) setFilter("");
            }}
            placeholder="Search chats or @usernames"
            aria-label="Search conversations"
            className="h-10 rounded-xl border-slate-200/90 bg-[#f8fafc] pr-10 pl-10 text-[13px] dark:border-[#392B33] dark:bg-[#151115]"
          />
          {filter ? (
            <button
              type="button"
              onClick={() => setFilter("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : (
            <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground lg:block">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mx-3 mt-3 grid grid-cols-3 gap-1 rounded-xl border border-slate-200/90 bg-[#f8fafc] p-1 dark:border-[#392B33] dark:bg-[#151115]">
        {TABS.map((t) => {
          const active = tab === t.id;
          const n = counts[t.id];
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                active
                  ? "bg-coal text-bone shadow-xs dark:bg-acid dark:text-coal"
                  : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-[#2B2027] dark:hover:text-[#F5EEDC]"
              }`}
            >
              {t.label}
              {n > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-px font-mono text-[9px] tabular-nums ${
                    active
                      ? "bg-acid text-coal font-black dark:bg-coal dark:text-acid"
                      : "bg-slate-200/80 text-slate-600 dark:bg-[#2B2027] dark:text-[#B9AAB0]"
                  }`}
                >
                  {n}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 pt-3">
        <NewChatDialog onOpen={onSelect} />
        <Button
          variant="outline"
          size="sm"
          aria-label="Create group"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("chatx-open-create-group"))
          }
          className="h-10 rounded-xl px-4 font-mono text-[11px] font-bold uppercase tracking-wider border-slate-200/90 bg-white hover:bg-slate-50 dark:border-[#392B33] dark:bg-[#21191D] dark:hover:bg-[#2B2027]"
        >
          <Users className="size-3.5 text-signal" aria-hidden />
          Group
        </Button>
      </div>

      <ScrollArea className="mt-3 min-h-0 flex-1 overscroll-contain">
        {convs.isPending ? (
          <div className="flex flex-col gap-2 p-3" aria-label="Loading conversations">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-elevated/20 p-3"
              >
                <Skeleton className="skeleton-shimmer size-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="skeleton-shimmer h-3.5 w-2/3 rounded-sm" />
                  <Skeleton className="skeleton-shimmer h-3 w-1/2 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : convs.isError ? (
          <ErrorState
            title="Could not load conversations"
            description="Check your connection and try again."
            onRetry={() => void convs.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={
              filter
                ? "No matches"
                : tab === "unread"
                  ? "All caught up"
                  : "Start something new"
            }
            description={
              filter
                ? `Nothing matches "${filter.trim()}". Try an @username.`
                : tab === "unread"
                  ? "No unread messages. Enjoy the quiet."
                  : "Search an @username or spin up a group."
            }
            action={
              filter ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 font-mono text-xs font-bold uppercase tracking-wider"
                  onClick={() => setFilter("")}
                >
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="sr-only" aria-live="polite">
              {items.length} of {counts.all} conversations shown
            </p>
            <ul className="flex flex-col gap-1 p-2" role="listbox" aria-label="Conversations">
              {items.map((c) => {
                const name = displayName(c, me?.id);
                const handle = handleOf(c, me?.id);
                const selected = c.id === activeId;
                const preview = c.lastMessage?.deleted
                  ? "This message was deleted"
                  : (c.lastMessage?.content ?? "");
                const isTyping =
                  typingUserIds(typingMap, c.id, me?.id).length > 0;
                const fullTime = new Date(
                  c.lastMessage?.createdAt ?? c.updatedAt
                ).toLocaleString();
                return (
                  <li key={c.id}>
                    <button
                      role="option"
                      aria-selected={selected}
                      aria-current={selected ? "true" : undefined}
                      onClick={() => {
                        onSelect?.(c.id);
                        router.push(`/chat/${c.id}`);
                      }}
                      className={`group relative flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                        selected
                          ? "border-acid/60 bg-acid/15 shadow-[inset_0_0_0_1px_rgba(213,244,91,0.3)] dark:bg-acid/10"
                          : "border-transparent hover:border-slate-200/90 hover:bg-slate-100/70 dark:hover:border-[#392B33] dark:hover:bg-[#21191D]"
                      }`}
                    >
                      {selected ? (
                        <span
                          aria-hidden
                          className="absolute top-1/2 left-0 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-acid shadow-[0_0_8px_rgba(213,244,91,0.8)]"
                        />
                      ) : null}
                      <UserAvatar
                        name={name}
                        avatarUrl={c.avatarUrl}
                        online={
                          c.type === "GROUP"
                            ? undefined
                            : otherOnline(c, me?.id)
                        }
                        className="shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13.5px] font-bold tracking-tight text-foreground">
                            {name}
                          </span>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="shrink-0 cursor-default font-mono text-[9px] font-bold tabular-nums text-muted-foreground">
                                  {formatConversationTime(
                                    c.lastMessage?.createdAt ?? c.updatedAt
                                  )}
                                </span>
                              }
                            />
                            <TooltipContent side="top">{fullTime}</TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {isTyping ? (
                              <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-signal">
                                <span className="flex items-center gap-0.5" aria-hidden>
                                  <span className="typing-dot bg-signal" />
                                  <span className="typing-dot bg-signal" />
                                  <span className="typing-dot bg-signal" />
                                </span>
                                typing…
                              </span>
                            ) : handle && !preview ? (
                              <span className="font-mono text-xs">{handle}</span>
                            ) : (
                              <span className="truncate font-medium">
                                {preview || handle || "No messages yet"}
                              </span>
                            )}
                          </span>
                          {c.unreadCount > 0 ? (
                            <Badge
                              aria-label={`${c.unreadCount} unread`}
                              className="h-5 min-w-5 shrink-0 border-0 bg-signal px-1.5 font-mono text-[10px] font-black text-bone tabular-nums shadow-sm"
                            >
                              {c.unreadCount > 99 ? "99+" : c.unreadCount}
                            </Badge>
                          ) : c.type === "GROUP" ? (
                            <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-elevated text-muted-foreground">
                              <Users className="size-3" aria-hidden />
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </ScrollArea>

      <div className="border-t border-sidebar-border bg-background/40 px-4 py-2.5">
        <p className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>
            {counts.all} chats · {counts.unread} unread
          </span>
          <span className="flex items-center gap-1.5 rounded-sm border border-acid/40 bg-acid px-2 py-0.5 text-[9px] font-black text-coal">
            <span className="live-dot size-1.5 rounded-full bg-coal" />
            Live
          </span>
        </p>
      </div>
    </div>
  );
}
