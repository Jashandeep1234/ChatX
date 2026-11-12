"use client";

import { useEffect, useState } from "react";
import {
  AtSign,
  Check,
  Copy,
  Edit3,
  Lock,
  Radio,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import { ProfileForm } from "@/components/profile/profile-form";
import { useAuthStore } from "@/lib/store/auth-store";

export function openProfileDialog() {
  document.dispatchEvent(new CustomEvent("chatx-open-profile"));
}

/** Your-details showcase and editor dialog */
export function ProfileDialog() {
  const me = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = () => {
      setActiveTab("view");
      setOpen(true);
    };
    document.addEventListener("chatx-open-profile", handler);
    return () => document.removeEventListener("chatx-open-profile", handler);
  }, []);

  async function handleCopyHandle() {
    if (!me?.username) return;
    try {
      await navigator.clipboard.writeText(`@${me.username}`);
      setCopied(true);
      toast.success(`Copied @${me.username} to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy handle");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-0 shadow-2xl sm:max-w-md">
        <DialogTitle className="sr-only">Operator Profile</DialogTitle>

        {/* ── Dialog Header with Navigation Tabs ── */}
        <div className="flex items-center justify-between border-b border-slate-200/90 bg-white px-5 py-3.5">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("view")}
              className={`rounded-lg px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-all ${
                activeTab === "view"
                  ? "bg-[#21191D] text-[#D5F45B] shadow-xs"
                  : "text-slate-500 hover:text-[#21191D]"
              }`}
            >
              Operator Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1 rounded-lg px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-all ${
                activeTab === "edit"
                  ? "bg-[#21191D] text-[#D5F45B] shadow-xs"
                  : "text-slate-500 hover:text-[#21191D]"
              }`}
            >
              <Edit3 className="size-3" />
              Edit Profile
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
            className="grid size-8 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#21191D]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "view" ? (
          /* ── SHOW PROFILE VIEW ── */
          <div className="flex flex-col overflow-y-auto">
            {/* Top Structural Strip */}
            <div className="flex items-center justify-between bg-[#21191D] px-6 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-[#88cf08] shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#D5F45B]">
                  Authenticated Operator
                </span>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">
                WSS Realtime
              </span>
            </div>

            {/* Profile Overview Card */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <UserAvatar
                  name={me?.name}
                  avatarUrl={me?.avatarUrl}
                  size="lg"
                  online
                  className="size-16 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-200"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-2xl font-black uppercase tracking-tight text-[#21191D]">
                    {me?.name ?? "Anonymous Operator"}
                  </h2>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#D5F45B] px-2.5 py-1 font-mono text-xs font-black text-[#21191D] shadow-xs">
                      <AtSign className="size-3" />
                      {me?.username ?? "handle"}
                    </span>

                    {me?.username ? (
                      <button
                        type="button"
                        onClick={handleCopyHandle}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-[#f8fafc] px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#21191D]"
                      >
                        {copied ? (
                          <>
                            <Check className="size-3 text-[#88cf08]" />
                            <span className="text-[#88cf08]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>

                  {me?.email ? (
                    <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-500">
                      <ShieldCheck className="size-3.5 text-[#88cf08]" />
                      <span className="truncate">{me.email}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Verified Credentials Grid */}
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Radio className="size-3.5 text-[#88cf08]" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      Socket Mesh
                    </span>
                  </div>
                  <p className="mt-1 font-display text-sm font-black uppercase text-[#21191D]">
                    Duplex Live
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    Latency ~38ms
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Lock className="size-3.5 text-[#F4513B]" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      Auth Session
                    </span>
                  </div>
                  <p className="mt-1 font-display text-sm font-black uppercase text-[#21191D]">
                    OAuth 2.0
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    HTTPOnly Cookie
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className="h-12 w-full rounded-xl bg-[#21191D] font-mono text-xs font-black uppercase tracking-widest text-[#D5F45B] shadow-md hover:bg-black active:scale-[0.99]"
                >
                  <Edit3 className="size-4" />
                  Edit Profile Details
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── EDIT PROFILE FORM ── */
          <div className="overflow-y-auto">
            <ProfileForm
              user={me}
              mode="edit"
              submitLabel="Save Changes"
              onSaved={() => {
                setActiveTab("view");
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
