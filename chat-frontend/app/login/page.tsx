"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  AtSign,
  Bell,
  Check,
  ChevronDown,
  FileUp,
  Globe,
  Images,
  Keyboard,
  Menu,
  MessagesSquare,
  Moon,
  Radio,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATS = [
  { k: "~38ms", v: "WebSocket latency", icon: Zap, badge: null, tag: "live" },
  { k: "25 MB", v: "File transmission", icon: FileUp, badge: "RAW", tag: null },
  { k: "Zero", v: "Message loss", icon: Radio, badge: "SYNC", tag: null },
  { k: "TLS 1.3", v: "End-to-end security", icon: Globe, badge: "E2EE", tag: null },
];

const FEED = [
  { text: "Alex Chen initialized socket session…", time: "just now", hot: true },
  { text: "Jonas routed through decentralized cluster", time: "1m ago", hot: false },
  { text: "Priya decrypted batch of 4 packages", time: "2m ago", hot: false },
  { text: "neural-weights.bin dispatched · 24 MB", time: "4m ago", hot: false },
  { text: "Rebel Squad expanded to 18 active nodes", time: "7m ago", hot: false },
];

const FAQS = [
  {
    q: "How do I discover collaborators and initiate direct lines?",
    a: "Every operator claims an unconventional @username. Hit 'New Chat', type their handle (e.g. @alex.chen), and establish an instantaneous connection. No invites, no delays.",
  },
  {
    q: "What payloads and asset transfers are permitted?",
    a: "Stream uncompressed assets, audio, and documents up to 25 MB with live bandwidth metrics. Previews render immediately without friction.",
  },
  {
    q: "How do optimistic dispatch and read receipts work?",
    a: "Every dispatch updates your local viewport synchronously. The multiplexed STOMP WebSocket confirms with honest state ticks: dispatched → received → verified.",
  },
  {
    q: "How resilient is the session architecture?",
    a: "OAuth 2.0 with cryptographic verification. Ephemeral tokens live solely in memory, while persistent refresh tokens sit sealed inside httpOnly cookies.",
  },
  {
    q: "Is mouse-free keyboard control fully operational?",
    a: "Yes. Key '/' engages global search, 'D' flips theme skin, 'Enter' fires transmissions, and 'Shift + Enter' inserts line breaks.",
  },
];

type HeroTab = "dm" | "group" | "files";

const HERO_TABS: Array<{ id: HeroTab; label: string }> = [
  { id: "dm", label: "Direct Message" },
  { id: "group", label: "Team Squad" },
  { id: "files", label: "Data Stream" },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-xl bg-acid font-black text-coal shadow-[0_0_20px_rgba(213,244,91,0.35)]">
        <MessagesSquare className="size-5 text-coal" aria-hidden />
      </span>
      <span className="font-display text-xl font-black tracking-tight text-foreground uppercase">
        ChatX<span className="text-acid">_</span>
      </span>
    </span>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("rounded-xl border border-border bg-card hover:bg-elevated text-foreground", className)}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4 text-signal" aria-hidden />
      ) : (
        <Moon className="size-4 text-foreground" aria-hidden />
      )}
    </Button>
  );
}

function HeroMockup({ tab }: { tab: HeroTab }) {
  if (tab === "dm") {
    return (
      <div key="dm" className="anim-fade-up">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#21191D] font-mono text-xs font-black text-[#F5EEDC] shadow-xs">
            AC
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="flex items-center gap-2 truncate text-[14px] font-black text-[#21191D]">
              Alex Chen
              <span className="size-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
            </p>
            <p className="font-mono text-[11px] font-bold text-slate-400">
              @alex.chen · active node
            </p>
          </div>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-black text-[#F4513B]">
            ✓✓ READ
          </span>
        </div>
        <div className="mt-4 space-y-3 text-[13px]">
          <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-xs border border-slate-200/90 bg-white px-4 py-3 text-[#21191D] font-medium shadow-xs">
            Has the new communication socket been deployed to staging?
          </div>
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-xs bg-[#D5F45B] border border-[#c6e944] px-4 py-3 font-bold text-[#21191D] shadow-xs">
            Live on all nodes! Handshake latency is locked under 40ms.
          </div>
          <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-xs border border-slate-200/90 bg-white px-4 py-3 text-[#21191D] font-medium shadow-xs">
            Excellent. The crisp white surfaces + Acid Lime highlights look exceptionally clean.
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs">
          <span className="flex items-center gap-1" aria-hidden>
            <span className="typing-dot bg-[#F4513B]" />
            <span className="typing-dot bg-[#F4513B]" />
            <span className="typing-dot bg-[#F4513B]" />
          </span>
          <p className="truncate text-xs text-slate-500 font-mono">
            <span className="font-bold text-[#21191D]">Alex Chen</span> is transmitting…
          </p>
        </div>
      </div>
    );
  }
  if (tab === "files") {
    return (
      <div key="files" className="anim-fade-up">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#21191D] text-[#D5F45B] shadow-xs">
            <FileUp className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-black text-[#21191D]">Enterprise Asset Stream</p>
            <p className="font-mono text-[11px] font-bold text-slate-400">
              3 files · 24.6 MB total · Raw payloads
            </p>
          </div>
          <span className="rounded-md bg-[#21191D] px-2 py-0.5 text-[10px] font-mono font-black text-[#D5F45B]">
            92%
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {[
            ["neural-mesh-v2.bin", "14.2 MB · completed"],
            ["blueprint-schematic.svg", "6.8 MB · completed"],
            ["quantum-keys.pem", "3.6 MB · uploading…"],
          ].map(([name, meta]) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc] border border-slate-200 text-[#F4513B]">
                <FileUp className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-[#21191D]">{name}</span>
                <span className="block font-mono text-[11px] text-slate-400">
                  {meta}
                </span>
              </span>
              {meta.includes("uploading") ? (
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full w-[92%] rounded-full bg-[#F4513B]" />
                </span>
              ) : (
                <Check className="size-4 text-success" aria-hidden />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-xl border border-slate-200/90 bg-[#f8fafc] p-2.5 text-center font-mono text-[11px] font-black text-[#21191D]">
          UNCOMPRESSED TRANSMISSION · 25 MB LIMIT
        </p>
      </div>
    );
  }
  return (
    <div key="group" className="anim-fade-up">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#21191D] font-mono text-xs font-black text-[#D5F45B] shadow-xs">
          WS
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex items-center gap-2 truncate text-sm font-black text-[#21191D] uppercase">
            Weekend Squad
            <span className="rounded-md bg-[#21191D] text-[#D5F45B] px-2 py-0.5 text-[9px] font-mono font-black">
              4 ACTIVE
            </span>
          </p>
          <p className="font-mono text-[11px] font-bold text-slate-400">
            @weekend.squad · primary channel
          </p>
        </div>
        <Bell className="size-4 text-slate-400" aria-hidden />
      </div>
      <div className="mt-4 space-y-3 text-[13px]">
        <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-xs border border-slate-200/90 bg-white px-4 py-3 text-[#21191D] font-medium shadow-xs">
          <span className="block font-mono text-[10px] font-black text-[#F4513B] tracking-wider mb-0.5">
            {"// PRIYA"}
          </span>
          Trip photos are in — check the dump
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-xs bg-[#D5F45B] border border-[#c6e944] px-4 py-3 font-bold text-[#21191D] shadow-xs">
          Booking tonight. Let&apos;s gooo
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
        <span className="flex -space-x-1.5" aria-hidden>
          {["AC", "JK", "+2"].map((t) => (
            <span
              key={t}
              className="flex size-6 items-center justify-center rounded-md border border-white bg-[#21191D] font-mono text-[9px] font-bold text-[#F5EEDC] shadow-2xs"
            >
              {t}
            </span>
          ))}
        </span>
        <p className="truncate text-xs text-slate-500 font-mono">
          <span className="font-bold text-[#21191D]">Alex</span> is transmitting…
        </p>
        <span className="ml-auto flex items-center gap-1" aria-hidden>
          <span className="typing-dot bg-[#F4513B]" />
          <span className="typing-dot bg-[#F4513B]" />
          <span className="typing-dot bg-[#F4513B]" />
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroTab, setHeroTab] = useState<HeroTab>("group");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="mesh-gradient min-h-svh overflow-x-clip text-foreground font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <span className="hidden shrink-0 whitespace-nowrap rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-foreground uppercase sm:block">
            NODE AUTH // PROTOCOL 0.1
          </span>

          <nav
            className="ml-6 hidden shrink-0 items-center gap-5 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground lg:flex"
            aria-label="Navigation"
          >
            <a href="#product" className="transition-colors hover:text-foreground">
              [Architecture]
            </a>
            <a href="#preview" className="transition-colors hover:text-foreground">
              [Tour]
            </a>
            <a href="#live" className="transition-colors hover:text-foreground">
              [Telemetry]
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              [FAQ]
            </a>
          </nav>

          <div className="ml-auto hidden items-center gap-3 sm:flex">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md font-mono text-xs font-bold uppercase tracking-wider text-foreground hover:bg-elevated"
              render={<a href="/signin" />}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="rounded-lg border-0 bg-primary text-primary-foreground font-black tracking-wider uppercase shadow-md hover:bg-primary/90 interactive-press px-5"
              render={<a href="/signin" />}
            >
              Get Started
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md border border-border bg-card"
            >
              {menuOpen ? (
                <X className="size-4" aria-hidden />
              ) : (
                <Menu className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <nav
            className="border-t border-border bg-card p-4 sm:hidden font-mono text-xs font-bold uppercase"
            aria-label="Mobile Navigation"
          >
            {[
              ["Architecture", "#product"],
              ["Tour", "#preview"],
              ["Telemetry", "#live"],
              ["FAQ", "#faq"],
              ["Sign In", "/signin"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block p-2.5 rounded-lg hover:bg-elevated text-foreground"
              >
                {"// "}{label}
              </a>
            ))}
            <Button
              size="sm"
              className="mt-3 w-full rounded-lg bg-primary text-primary-foreground font-black uppercase hover:bg-primary/90"
              render={
                <a href="/signin" onClick={() => setMenuOpen(false)} />
              }
            >
              Get Started →
            </Button>
          </nav>
        ) : null}
      </header>

      {/* Hero Section: Crisp White Surface + Coal & Acid Highlights */}
      <section id="product" className="relative scroll-mt-20 overflow-hidden pt-10 pb-20 sm:pt-14">
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
            {/* Left Column: Branding, Value Proposition, Action CTAs */}
            <div className="text-center lg:text-left">
              <div className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-[#21191D] shadow-xs">
                <span className="live-dot size-2 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                <span>REALTIME MESH ACTIVE</span>
                <span className="rounded-full bg-[#F4513B] px-2 py-0.5 text-[9px] font-black text-white">
                  PROTOCOL 0.1
                </span>
              </div>

              <h1 className="anim-fade-up stagger-1 mt-6 font-display text-5xl leading-[1.0] font-black tracking-tight text-[#21191D] sm:text-6xl lg:text-7xl text-balance">
                Chat that <span className="relative inline-block"><span className="relative z-10">keeps up</span><span className="absolute bottom-1.5 left-0 -z-0 h-3 w-full bg-[#D5F45B] rounded-xs -rotate-1" /></span> with you.
              </h1>

              <p className="anim-fade-up stagger-2 mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-slate-600 sm:text-lg lg:mx-0 font-medium">
                DMs, groups, files, typing and presence over one multiplexed socket — optimistic sends, honest receipts, zero clutter.
              </p>

              <div className="anim-fade-up stagger-3 mt-8 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center lg:justify-start sm:justify-center">
                <Button
                  size="lg"
                  className="rounded-2xl border-0 bg-[#D5F45B] text-[#21191D] font-black text-sm uppercase tracking-wider px-8 h-13 shadow-md hover:bg-[#cbf23a] interactive-press"
                  render={<a href="/signin" />}
                >
                  Get Started
                  <ArrowRight className="size-4.5 stroke-[2.5]" aria-hidden />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-slate-200/90 bg-white px-7 h-13 font-mono text-xs font-black uppercase tracking-wider text-[#21191D] hover:bg-slate-50 interactive-press shadow-xs"
                  render={<a href="/signin" />}
                >
                  <Globe className="size-4 text-[#F4513B]" aria-hidden />
                  Sign in with Google
                </Button>
              </div>

              {/* Verified Trust Tokens */}
              <div className="anim-fade-up stagger-4 mt-8 flex flex-wrap items-center justify-center gap-4 text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider lg:justify-start">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Check className="size-3.5 text-success stroke-[3]" /> Zero Logs
                </span>
                <span className="size-1 rounded-full bg-slate-300" />
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Check className="size-3.5 text-success stroke-[3]" /> Ephemeral Memory
                </span>
                <span className="size-1 rounded-full bg-slate-300" />
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Check className="size-3.5 text-success stroke-[3]" /> Single Port WSS
                </span>
              </div>
            </div>

            {/* Right Column: Hero Studio Deck Mockup Card */}
            <div className="anim-fade-up stagger-2 relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-[32px] border border-slate-200/90 bg-white p-5 shadow-2xl shadow-slate-200/60 sm:p-7">
                {/* Studio Deck Window Bar */}
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="size-3 rounded-full bg-slate-200" />
                    <span className="size-3 rounded-full bg-slate-200" />
                    <span className="size-3 rounded-full bg-slate-200" />
                    <span className="ml-2 font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
                      LIVE RUNTIME
                    </span>
                  </div>

                  <div
                    className="grid w-full grid-cols-3 gap-1 rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-1 sm:w-auto"
                    role="tablist"
                    aria-label="Preview mode"
                  >
                    {HERO_TABS.map((t) => (
                      <button
                        key={t.id}
                        role="tab"
                        aria-selected={heroTab === t.id}
                        onClick={() => setHeroTab(t.id)}
                        className={cn(
                          "rounded-xl px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider transition-all",
                          heroTab === t.id
                            ? "bg-[#21191D] text-[#D5F45B] shadow-xs"
                            : "text-slate-500 hover:text-[#21191D]"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inner Window Display */}
                <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-4 sm:p-5">
                  <HeroMockup tab={heroTab} />
                </div>
              </div>

              {/* Floating Live Telemetry Badge */}
              <div className="anim-float absolute -top-3.5 -right-2 flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 font-mono text-xs font-black text-[#21191D] shadow-lg shadow-slate-200/60">
                <span className="live-dot size-2 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                <span>Live Socket</span>
                <span className="rounded-md bg-[#21191D] px-1.5 py-0.5 text-[10px] text-[#D5F45B]">
                  ~38ms
                </span>
              </div>

              {/* Floating Instant Find Badge */}
              <div
                className="anim-float absolute -bottom-4 -left-2 flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 font-mono text-xs font-black text-[#21191D] shadow-lg shadow-slate-200/60"
                style={{ animationDelay: "1.4s" }}
              >
                <div className="grid size-5 place-items-center rounded-full bg-[#F4513B] text-white">
                  <AtSign className="size-3" aria-hidden />
                </div>
                <span>@alex.chen</span>
                <span className="font-mono text-[11px] font-medium text-slate-400">found instantly</span>
              </div>
            </div>
          </div>

          {/* Stat Bento Pods */}
          <div className="anim-fade-up stagger-3 mt-16 grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.k}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-[#21191D] text-[#D5F45B] shadow-2xs">
                      <Icon className="size-4.5" />
                    </span>
                    {s.tag === "live" ? (
                      <span className="live-dot size-2 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                    ) : s.badge ? (
                      <span className="rounded-md border border-slate-200 bg-[#f8fafc] px-2 py-0.5 font-mono text-[9px] font-black text-[#21191D]">
                        {s.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <p className="font-display text-3xl font-black text-[#21191D]">{s.k}</p>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                      {s.v}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bento Tour Section */}
      <section id="preview" className="scroll-mt-20 py-20 border-t border-border/90 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
          <p className="font-mono text-xs font-bold tracking-widest text-signal uppercase">
            01 // TAKE THE TOUR
          </p>
          <h2 className="mx-auto mt-2 max-w-2xl font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#21191D] text-balance">
            Peek inside before you sign in.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-mono text-xs leading-relaxed text-slate-500 font-medium">
            Real product, miniature. Every module below represents an active architectural subsystem of ChatX.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 pt-12 pb-8 sm:px-6 lg:grid-cols-3">
          {/* ── ROW 1 ── */}
          {/* Card 1: DMs & Groups (2 cols) */}
          <div className="group lg:col-span-2 flex flex-col justify-between rounded-[28px] border border-slate-200/90 bg-[#f8fafc] p-7 shadow-xs transition-all hover:border-slate-300 hover:shadow-md sm:p-8">
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#21191D] text-[#D5F45B] shadow-xs">
                  <MessagesSquare className="size-6 text-[#D5F45B]" aria-hidden />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#21191D] shadow-xs">
                  <span className="live-dot size-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                  3 Online
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-black uppercase tracking-tight text-[#21191D] sm:text-3xl">
                DMs & groups that feel alive
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                1:1s and group chats with roles, avatars and honest read receipts — presence is baked into every row.
              </p>
            </div>

            {/* Chat Thread Mockup */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-[#21191D]">
                    Weekend Squad
                  </span>
                  <span className="rounded-full bg-[#f8fafc] border border-slate-200 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-500">
                    Primary
                  </span>
                </div>
                <div className="flex -space-x-1.5" aria-hidden>
                  {["AC", "JK", "PS"].map((init) => (
                    <span
                      key={init}
                      className="flex size-7 items-center justify-center rounded-lg border-2 border-white bg-[#21191D] font-mono text-[9px] font-black text-[#D5F45B] shadow-xs"
                    >
                      {init}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 font-mono text-xs">
                <p className="flex items-center gap-2 text-slate-500">
                  <span className="live-dot size-2 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                  <span className="font-bold text-[#21191D]">Alex</span> is transmitting…
                </p>
                <span className="flex items-center gap-1" aria-hidden>
                  <span className="typing-dot bg-[#F4513B]" />
                  <span className="typing-dot bg-[#F4513B]" />
                  <span className="typing-dot bg-[#F4513B]" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Realtime Stream (1 col) */}
          <div className="group lg:col-span-1 flex flex-col justify-between rounded-[28px] border border-slate-200/90 bg-[#f8fafc] p-7 shadow-xs transition-all hover:border-slate-300 hover:shadow-md sm:p-8">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#21191D] text-[#D5F45B] shadow-xs">
                  <Zap className="size-6 text-[#D5F45B]" aria-hidden />
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-xs">
                  Socket Mesh
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-black uppercase tracking-tight text-[#21191D]">
                Realtime
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                Zero lag stream over multiplexed STOMP WebSocket.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                  Latency
                </span>
                <span className="font-mono text-[10px] font-black uppercase text-[#88cf08]">
                  ● Active
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-black tracking-tight text-[#21191D]">
                ~38<span className="font-mono text-base font-bold text-slate-400">ms</span>
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4513B]">
                <span>WSS // DUPLEX</span>
                <span>ZERO LOSS</span>
              </div>
            </div>
          </div>

          {/* ── ROW 2 ── */}
          {/* Card 3: @Usernames (1 col) */}
          <div className="group lg:col-span-1 flex flex-col justify-between rounded-[28px] border border-slate-200/90 bg-[#f8fafc] p-7 shadow-xs transition-all hover:border-slate-300 hover:shadow-md sm:p-8">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#F4513B] text-white shadow-xs">
                  <AtSign className="size-6" aria-hidden />
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-xs">
                  Directory
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-black uppercase tracking-tight text-[#21191D]">
                @usernames
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                Everyone gets a unique handle. Search and connect in 1 tap.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 font-mono text-xs font-bold text-[#21191D]">
                <AtSign className="size-3.5 text-slate-400" />
                <span className="font-bold">alex.chen</span>
                <Check className="size-3.5 ml-auto text-[#88cf08]" />
              </div>
              <p className="mt-3 font-mono text-[10px] font-black uppercase tracking-wider text-[#88cf08] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#88cf08]" />
                Available — Claimed in 1 tap
              </p>
            </div>
          </div>

          {/* Card 4: Rich Sharing (1 col) */}
          <div className="group lg:col-span-1 flex flex-col justify-between rounded-[28px] border border-slate-200/90 bg-[#f8fafc] p-7 shadow-xs transition-all hover:border-slate-300 hover:shadow-md sm:p-8">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#D5F45B] text-[#21191D] shadow-xs">
                  <Images className="size-6 text-[#21191D]" aria-hidden />
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-xs">
                  Payload
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-black uppercase tracking-tight text-[#21191D]">
                Rich Sharing
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                Images, archives, and raw files up to 25 MB directly in thread.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-[#21191D] truncate">beach-day.zip</span>
                <span className="text-slate-400 font-medium shrink-0">85%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[85%] rounded-full bg-[#21191D]" />
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>12 MB / 14 MB</span>
                <span className="text-[#21191D]">Streaming</span>
              </div>
            </div>
          </div>

          {/* Card 5: Keys (1 col) */}
          <div className="group lg:col-span-1 flex flex-col justify-between rounded-[28px] border border-slate-200/90 bg-[#f8fafc] p-7 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:p-8">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                <span className="grid size-12 place-items-center rounded-2xl border border-slate-200 bg-white text-[#21191D] shadow-xs">
                  <Keyboard className="size-6 text-[#21191D]" aria-hidden />
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-xs">
                  Keyboard
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-black uppercase tracking-tight text-[#21191D]">
                Keys
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                Mouse-free keyboard control built for lightning execution.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex flex-col gap-2 font-mono text-xs">
                {[
                  ["/", "Search chats"],
                  ["↵", "Send message"],
                  ["⇧↵", "Line break"],
                  ["Esc", "Close / Clear"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <kbd className="rounded-md border border-slate-200 bg-[#f8fafc] px-2 py-0.5 font-mono text-[10px] font-black text-[#21191D] shadow-2xs">
                      {k}
                    </kbd>
                    <span className="text-[11px] font-bold text-slate-500">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Activity Wire & Telemetry */}
      <section id="live" className="scroll-mt-20 py-20 border-t border-slate-200/90 bg-[#f8fafc]">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Left Column: Context, Features, Try it Live CTA */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 font-mono text-[11px] font-black tracking-widest text-[#F4513B] uppercase shadow-xs">
                <span>02 // LIVE TELEMETRY</span>
              </div>

              <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#21191D] text-balance">
                Everything, the second it happens.
              </h2>

              <p className="mt-4 text-base leading-relaxed text-slate-500 font-medium">
                Typing, presence, receipts and uploads stream into every view — sidebar, header, thread. This is the actual wire running at sub-40ms latency:
              </p>

              {/* Protocol Spec Pills */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  "Optimistic Cache",
                  "STOMP Stream",
                  "Binary Payloads",
                  "Verified State",
                ].map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1 font-mono text-xs font-bold text-[#21191D] shadow-2xs"
                  >
                    <span className="size-1.5 rounded-full bg-[#88cf08]" />
                    {spec}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Button
                  size="lg"
                  className="rounded-2xl border-0 bg-[#21191D] text-[#D5F45B] font-black text-xs uppercase tracking-wider px-7 h-12 shadow-md hover:bg-black interactive-press"
                  render={<a href="/signin" />}
                >
                  Try It Live
                  <ArrowRight className="size-4 stroke-[2.5]" aria-hidden />
                </Button>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-400">
                  <span className="live-dot size-2 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                  <span>Sub-40ms latency guaranteed</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Tech Telemetry Stream Window */}
            <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-7">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#21191D] text-[#D5F45B] shadow-xs">
                    <Radio className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-black uppercase text-[#21191D]">
                      Live Wire Session
                    </h3>
                    <p className="font-mono text-[11px] font-bold text-slate-400">
                      Duplex STOMP channel // node-cluster-01
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#21191D] shadow-2xs">
                    <span className="live-dot size-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                    STREAMING
                  </span>
                </div>
              </div>

              {/* Live Event Stream */}
              <ul className="mt-5 space-y-2.5">
                {FEED.map((e, index) => (
                  <li
                    key={e.text}
                    className={cn(
                      "flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-mono transition-all",
                      e.hot
                        ? "border border-[#21191D] bg-[#21191D] text-white shadow-md shadow-slate-300/40"
                        : "border border-slate-200/80 bg-[#f8fafc] text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black",
                        e.hot
                          ? "bg-[#D5F45B] text-[#21191D]"
                          : "bg-white border border-slate-200 text-slate-400"
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className={cn("flex-1 truncate", e.hot ? "font-bold text-[#F5EEDC]" : "font-medium")}>
                      {e.text}
                    </span>

                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums shrink-0",
                        e.hot
                          ? "bg-white/10 text-[#D5F45B]"
                          : "bg-white border border-slate-200 text-slate-400"
                      )}
                    >
                      {e.time}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Wire Status Telemetry Bar */}
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-[#f8fafc] px-4 py-3 font-mono text-[11px] font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                  <span className="text-[#21191D]">5 / 5 Packets Acknowledged</span>
                </span>
                <span className="text-[#F4513B]">100% HEALTH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Base & Protocols (FAQ) */}
      <section id="faq" className="scroll-mt-20 py-20 border-t border-slate-200/90 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafc] px-3.5 py-1 font-mono text-[11px] font-black tracking-widest text-[#F4513B] uppercase shadow-2xs">
              <span>03 // KNOWLEDGE BASE</span>
            </div>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#21191D] text-balance">
              Questions & Protocols.
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-mono text-xs leading-relaxed text-slate-500 font-medium">
              Architectural specifications, packet encryption, and socket behaviors unpacked.
            </p>
          </div>

          <div className="mt-12 space-y-3.5">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={f.q}
                  className={cn(
                    "rounded-[24px] border transition-all duration-200 overflow-hidden",
                    open
                      ? "border-slate-300 bg-white shadow-xl shadow-slate-200/50"
                      : "border-slate-200/80 bg-[#f8fafc] hover:border-slate-300 hover:bg-white hover:shadow-xs"
                  )}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-black transition-colors",
                          open
                            ? "bg-[#D5F45B] text-[#21191D]"
                            : "bg-white border border-slate-200 text-slate-400"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-base sm:text-lg font-black text-[#21191D] truncate sm:text-wrap">
                        {f.q}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 shadow-2xs",
                        open
                          ? "bg-[#21191D] text-[#D5F45B] rotate-180"
                          : "bg-white border border-slate-200 text-slate-400 hover:text-[#21191D]"
                      )}
                    >
                      <ChevronDown className="size-4.5 stroke-[2.5]" />
                    </span>
                  </button>

                  {open ? (
                    <div className="px-6 pb-6 pt-1 text-[14px] leading-relaxed text-slate-600 font-medium border-t border-slate-100 sm:ml-12">
                      <p className="mt-3 bg-[#f8fafc] rounded-2xl p-4 border border-slate-200/70 font-sans text-slate-600">
                        {f.a}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Need help footer card */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[24px] border border-slate-200/90 bg-[#f8fafc] p-6 shadow-xs">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#21191D] text-[#D5F45B] shadow-xs">
                <MessagesSquare className="size-5" />
              </span>
              <div>
                <p className="font-display text-sm font-black uppercase text-[#21191D]">Have technical questions?</p>
                <p className="font-mono text-xs text-slate-400">Launch a session or inspect our open-source socket protocol.</p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl border-0 bg-[#21191D] text-[#D5F45B] font-black text-xs uppercase tracking-wider px-5 h-10 shadow-xs hover:bg-black"
              render={<a href="/signin" />}
            >
              Start Chatting →
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-mono text-xs text-slate-400">
              © 2026 ChatX · Realtime Engine · Zero Logs
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="hover:text-[#21191D] transition-colors">SOCKET</span>
            <span>·</span>
            <span className="hover:text-[#21191D] transition-colors">PRESENCE</span>
            <span>·</span>
            <span className="hover:text-[#21191D] transition-colors">RECEIPTS</span>
            <span>·</span>
            <span className="text-[#88cf08]">● 100% OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
