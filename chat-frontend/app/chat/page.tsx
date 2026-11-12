"use client";

import {
  ArrowUpRight,
  AtSign,
  MessagesSquare,
  Users,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";

function focusSearch() {
  document.getElementById("sidebar-search")?.focus();
}

function openNewChat() {
  document.dispatchEvent(new CustomEvent("chatx-open-new-chat"));
}

function openCreateGroup() {
  document.dispatchEvent(new CustomEvent("chatx-open-create-group"));
}

const STEPS = [
  {
    icon: MessagesSquare,
    title: "Select a thread",
    desc: "Pick from your recent DMs or team groups in the left sidebar.",
    action: focusSearch,
  },
  {
    icon: AtSign,
    title: "Search @handle",
    desc: "Instant lookup across the entire workspace directory.",
    action: openNewChat,
  },
  {
    icon: Users,
    title: "Spin up a group",
    desc: "Name it, invite collaborators, and stream messages in realtime.",
    action: openCreateGroup,
  },
];

export default function ChatIndexPage() {
  return (
    <div className="chat-canvas flex flex-1 items-center justify-center p-6 sm:p-10">
      <div className="anim-fade-up flex w-full max-w-3xl flex-col items-center text-center">
        {/* Central visual mark */}
        <div className="relative mb-6 flex h-20 w-64 items-center justify-center" aria-hidden>
          <span className="grid size-16 place-items-center rounded-2xl bg-acid text-coal shadow-[0_0_32px_rgba(213,244,91,0.4)]">
            <MessagesSquare className="size-8 text-coal" aria-hidden />
          </span>
          <span className="absolute left-2 grid h-8 place-items-center rounded-full border border-slate-200/90 bg-white px-3 font-mono text-[11px] font-bold text-signal shadow-xs dark:border-[#392B33] dark:bg-[#21191D]">
            @alex
          </span>
          <span className="absolute right-2 grid h-8 place-items-center rounded-full border border-slate-200/90 bg-white px-3 font-mono text-[11px] font-bold text-coal shadow-xs dark:border-[#392B33] dark:bg-[#21191D] dark:text-bone">
            @jonas
          </span>
        </div>

        {/* Status indicator */}
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 shadow-xs dark:border-[#392B33] dark:bg-[#21191D] dark:text-[#B9AAB0]">
          <span className="live-dot size-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
          Nexus realtime runtime active
        </span>

        {/* Heading */}
        <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#21191D] dark:text-[#F5EEDC]">
          Ready to start communicating.
        </h2>

        {/* Subtitle */}
        <p className="mt-3 max-w-xl font-mono text-xs leading-relaxed text-slate-500 font-medium dark:text-[#B9AAB0]">
          Multiplexed STOMP WebSocket is live. Select an existing conversation
          or reach someone directly using their handle.
        </p>

        {/* 3 Action Cards */}
        <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.title}
                type="button"
                onClick={s.action}
                className={`group anim-fade-up relative rounded-2xl border border-slate-200/90 bg-white p-6 text-left shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-[#392B33] dark:bg-[#21191D] dark:hover:border-[#482B36] stagger-${i + 1}`}
              >
                <span className="mb-4 grid size-10 place-items-center rounded-xl bg-slate-100 text-[#21191D] transition-colors group-hover:bg-acid group-hover:text-coal dark:bg-[#151115] dark:text-bone dark:group-hover:bg-acid dark:group-hover:text-coal">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="font-display text-base font-black uppercase tracking-tight text-[#21191D] dark:text-[#F5EEDC]">
                  {s.title}
                </p>
                <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-slate-500 dark:text-[#B9AAB0]">
                  {s.desc}
                </p>
                <ArrowUpRight
                  className="absolute top-5 right-5 size-4 text-slate-400 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        {/* Trust metrics */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-slate-200/70 pt-6 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-[#392B33] dark:text-[#B9AAB0]">
          <span className="flex items-center gap-1.5">
            <Zap className="size-3.5 text-success" /> ~40ms handshake
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-signal" /> Verified SSO
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-acid" /> 25 MB transfers
          </span>
        </div>
      </div>
    </div>
  );
}
