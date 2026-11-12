"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  MessagesSquare,
  PanelLeft,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar/sidebar";
import { CreateGroupDialog } from "@/components/group/create-group-dialog";
import {
  ProfileDialog,
  openProfileDialog,
} from "@/components/profile/profile-dialog";
import { UserAvatar } from "@/components/common/user-avatar";
import { logoutNow } from "@/lib/api/auth";
import { useConversations } from "@/hooks/use-chat-queries";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { stompSingleton } from "@/lib/ws/stomp-client";
import { useChatSocket } from "@/lib/ws/use-chat-socket";

function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const totalUnread =
    useConversations().data?.reduce((n, c) => n + (c.unreadCount ?? 0), 0) ?? 0;

  async function logout() {
    stompSingleton.disconnect();
    await logoutNow();
    router.replace("/login");
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-border">
      <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="min-h-10 min-w-10 sm:hidden"
          aria-label="Toggle conversations"
          onClick={onToggleSidebar}
        >
          <PanelLeft className="size-4" aria-hidden />
        </Button>

        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-acid text-coal shadow-[0_0_20px_rgba(213,244,91,0.35)]">
            <MessagesSquare className="size-5 text-coal" aria-hidden />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-lg font-black uppercase tracking-tight text-foreground">
              ChatX<span className="text-acid">_</span>
            </span>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground min-[420px]:flex">
              <span className="live-dot size-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
              Realtime mesh
            </span>
          </span>
          {totalUnread > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-sm bg-signal px-1.5 font-mono text-[10px] font-black text-bone shadow-sm">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          ) : null}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="mr-1 hidden items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-xs xl:flex">
            <kbd className="rounded-md border border-slate-200 bg-[#f8fafc] px-1.5 py-0.5 font-bold text-[#21191D]">
              /
            </kbd>
            search
          </span>
          <Button
            size="sm"
            aria-label="Create group"
            className="hidden rounded-xl bg-[#21191D] text-white hover:bg-[#21191D]/90 font-mono text-[11px] font-bold uppercase tracking-wider shadow-sm sm:inline-flex"
            onClick={() =>
              document.dispatchEvent(new CustomEvent("chatx-open-create-group"))
            }
          >
            <Plus className="size-3.5 text-[#D5F45B]" aria-hidden />
            <span className="hidden lg:inline">New group</span>
          </Button>
          <button
            onClick={openProfileDialog}
            aria-label="Open your profile"
            className="hidden items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white py-1 pl-1 pr-2.5 text-left shadow-xs transition-all hover:bg-slate-50 hover:border-slate-300 sm:flex"
          >
            <UserAvatar
              name={me?.name}
              avatarUrl={me?.avatarUrl}
              online
              size="sm"
            />
            <span className="hidden max-w-[150px] leading-tight xl:block">
              <span className="block truncate text-xs font-bold text-[#21191D]">
                {me?.name ?? "…"}
              </span>
              <span className="block truncate font-mono text-[11px] text-slate-500">
                {me?.username ? `@${me.username}` : (me?.email ?? "…")}
              </span>
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            aria-label="Log out"
            className="hidden rounded-xl border border-slate-200/90 bg-white text-slate-500 hover:text-[#F4513B] shadow-xs sm:inline-flex"
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            aria-label="Log out"
            className="min-h-10 min-w-10 sm:hidden"
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}

function ChatShell({ children }: { children: React.ReactNode }) {
  const convs = useConversations();
  const ids = (convs.data ?? []).map((c) => c.id);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [prevActiveId, setPrevActiveId] = useState<string | null>(null);
  const activeId = useChatStore((s) => s.activeConversationId);

  useChatSocket(ids);

  if (activeId !== prevActiveId) {
    setPrevActiveId(activeId);
    setMobileView(activeId ? "chat" : "list");
  }

  return (
    <div className="aurora-bg relative flex h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <div
        className="pointer-events-none absolute inset-0 grid-lines opacity-40 dark:opacity-30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-acid/[0.05] to-transparent"
        aria-hidden
      />
      <TopBar
        onToggleSidebar={() =>
          setMobileView((v) => (v === "list" ? "chat" : "list"))
        }
      />

      <div className="relative mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 sm:gap-4 sm:p-4 lg:gap-5 lg:p-5">
        <aside
          className={`relative min-h-0 w-full shrink-0 overflow-hidden border border-slate-200/90 bg-white sm:rounded-[28px] sm:shadow-xl sm:shadow-slate-200/40 sm:w-[350px] lg:w-[380px] dark:border-[#392B33] dark:bg-[#21191D] dark:shadow-none ${
            mobileView === "chat" ? "hidden sm:block" : "block"
          }`}
          aria-label="Conversations"
        >
          <Sidebar onSelect={() => setMobileView("chat")} />
        </aside>

        <section
          className={`relative min-h-0 min-w-0 flex-1 overflow-hidden border border-slate-200/90 bg-white sm:rounded-[28px] sm:shadow-xl sm:shadow-slate-200/40 dark:border-[#392B33] dark:bg-[#21191D] dark:shadow-none ${
            mobileView === "list"
              ? "hidden sm:flex sm:flex-col"
              : "flex flex-col"
          }`}
          aria-label="Chat"
        >
          {children}
        </section>
      </div>

      <CreateGroupDialog />
      <ProfileDialog />
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ChatShell>{children}</ChatShell>
    </AuthGuard>
  );
}
