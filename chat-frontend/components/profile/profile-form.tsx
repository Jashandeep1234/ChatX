"use client";

import { useMemo, useState } from "react";
import {
  AtSign,
  Check,
  Copy,
  Link2,
  Loader2,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/common/user-avatar";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useUpdateProfile, useUserSearch } from "@/hooks/use-chat-queries";
import { searchUsers } from "@/lib/api/users";
import { apiErrorMessage } from "@/lib/api/errors";
import { usernameSchema } from "@/lib/validators";
import { useAuthStore } from "@/lib/store/auth-store";
import type { UserResponse } from "@/types";

function normalizeHandle(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, ".");
}

interface ProfileFormProps {
  user: UserResponse | null;
  submitLabel?: string;
  onSaved?: (u: UserResponse) => void;
  footerNote?: React.ReactNode;
  mode?: "edit" | "create";
}

export function ProfileForm({
  user,
  submitLabel = "Save details",
  onSaved,
  footerNote,
  mode = "edit",
}: ProfileFormProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prevUserId, setPrevUserId] = useState(user?.id);
  const update = useUpdateProfile();

  // Sync when user changes
  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id);
    setName(user?.name ?? "");
    setUsername(user?.username ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
    setTouched(false);
  }

  const normalized = useMemo(() => normalizeHandle(username), [username]);
  const debouncedHandle = useDebouncedValue(normalized, 450);

  const formatError = useMemo(() => {
    if (!touched && !username) return null;
    if (!normalized) return "Username is required.";
    const parsed = usernameSchema.safeParse(normalized);
    return parsed.success ? null : parsed.error.issues[0]?.message ?? "Invalid username.";
  }, [normalized, touched, username]);

  const shouldCheck =
    !!debouncedHandle &&
    !formatError &&
    debouncedHandle !== (user?.username ?? "").toLowerCase();

  const availability = useUserSearch(shouldCheck ? debouncedHandle : "");
  const exactTaken = useMemo(() => {
    if (!shouldCheck || !availability.data) return false;
    return availability.data.some(
      (u) =>
        (u.username ?? "").toLowerCase() === debouncedHandle.toLowerCase() &&
        u.id !== user?.id
    );
  }, [shouldCheck, availability.data, debouncedHandle, user?.id]);

  const dirty =
    name.trim() !== (user?.name ?? "") ||
    normalized !== (user?.username ?? "").toLowerCase() ||
    (avatarUrl.trim() || "") !== (user?.avatarUrl ?? "");

  async function handleCopyHandle() {
    if (!normalized) return;
    try {
      await navigator.clipboard.writeText(`@${normalized}`);
      setCopied(true);
      toast.success(`Copied @${normalized} to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy handle");
    }
  }

  async function save() {
    setTouched(true);
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Display name is required.");
      return;
    }
    const parsed = usernameSchema.safeParse(normalized);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid username.");
      return;
    }

    try {
      const results = await searchUsers(normalized);
      const taken = results.some(
        (u) =>
          (u.username ?? "").toLowerCase() === normalized.toLowerCase() &&
          u.id !== user?.id
      );
      if (taken) {
        toast.error(`@${normalized} is already taken. Try another.`);
        return;
      }
    } catch {
      // Ignore search error; backend validates authoritative state
    }

    try {
      const updated = await update.mutateAsync({
        name: cleanName,
        username: normalized,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      });
      useAuthStore.getState().setUser(updated);
      toast.success(
        updated.username ? `Profile updated as @${updated.username}` : "Profile saved."
      );
      onSaved?.(updated);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not save profile."));
    }
  }

  return (
    <div className="flex flex-col overflow-hidden bg-white">
      {/* ── 1. High-Tech Identity Showcase Card ── */}
      <div className="relative border-b border-slate-200/90 bg-white">
        {/* Coal Structural Top Bar */}
        <div className="flex items-center justify-between bg-[#21191D] px-5 py-2.5 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-[#88cf08] shadow-[0_0_8px_rgba(136,207,8,0.9)]" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#D5F45B]">
              ChatX // Node Operator ID
            </span>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">
            Protocol 0.1
          </span>
        </div>

        {/* Clean Showcase Body */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <UserAvatar
                name={name || user?.name}
                avatarUrl={avatarUrl.trim() || user?.avatarUrl}
                size="lg"
                online
                className="size-16 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-200"
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-display text-xl font-black uppercase tracking-tight text-[#21191D] sm:text-2xl">
                  {name.trim() || user?.name || "Anonymous Operator"}
                </h3>
              </div>

              {/* Handle Tag with Copy Button */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#D5F45B] px-2.5 py-0.5 font-mono text-xs font-black text-[#21191D] shadow-xs">
                  <AtSign className="size-3" aria-hidden />
                  {normalized || user?.username || "handle"}
                </span>

                {normalized ? (
                  <button
                    type="button"
                    onClick={handleCopyHandle}
                    aria-label="Copy handle"
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

              {/* Email Tag */}
              {user?.email ? (
                <p className="mt-2 flex items-center gap-1.5 truncate font-mono text-xs font-medium text-slate-500">
                  <ShieldCheck className="size-3.5 text-[#88cf08]" aria-hidden />
                  <span className="truncate">{user.email}</span>
                </p>
              ) : null}
            </div>
          </div>

          {/* Trust & Network Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-[#f8fafc] px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-slate-600">
              <Radio className="size-3 text-[#88cf08]" />
              Realtime Mesh Active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-[#f8fafc] px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-slate-600">
              <Lock className="size-3 text-[#F4513B]" />
              Verified OAuth 2.0
            </span>
            <span className="ml-auto inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <Zap className="size-3 text-[#D5F45B]" />
              ~38ms WSS
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Form Fields ── */}
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* Display Name */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="profile-name"
            className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600"
          >
            <span className="flex items-center gap-1.5">
              <User className="size-3.5 text-slate-400" />
              Display Name
            </span>
            <span className="font-mono text-[9px] text-slate-400">
              {name.length}/100
            </span>
          </Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="e.g. Alex Chen"
            className="h-12 rounded-xl border-slate-200 bg-[#f8fafc] px-4 font-semibold text-[#21191D] shadow-none placeholder:font-normal placeholder:text-slate-400 focus-visible:border-[#21191D] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#D5F45B]/40"
          />
        </div>

        {/* Username / Handle with Live Availability */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="profile-username"
            className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600"
          >
            <span className="flex items-center gap-1.5">
              <AtSign className="size-3.5 text-slate-400" />
              Unique Operator Handle
            </span>
            <span className="font-mono text-[9px] text-slate-400">
              {normalized.length}/30
            </span>
          </Label>

          <div className="relative flex items-center">
            {/* Left @ Badge */}
            <div className="pointer-events-none absolute left-3 flex items-center justify-center rounded-md bg-[#D5F45B] px-1.5 py-0.5 font-mono text-xs font-black text-[#21191D]">
              @
            </div>

            <Input
              id="profile-username"
              value={username}
              onChange={(e) => {
                setUsername(normalizeHandle(e.target.value));
                setTouched(true);
              }}
              maxLength={30}
              placeholder="alex.chen"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 rounded-xl border-slate-200 bg-[#f8fafc] pr-28 pl-10 font-mono text-sm font-bold text-[#21191D] shadow-none placeholder:font-normal placeholder:text-slate-400 focus-visible:border-[#21191D] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#D5F45B]/40"
              aria-describedby="profile-username-hint"
            />

            {/* Right Status Indicator */}
            <div className="absolute right-3 flex items-center">
              {availability.isPending && shouldCheck ? (
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500">
                  <Loader2 className="size-3.5 animate-spin text-[#F4513B]" />
                  Checking…
                </span>
              ) : !formatError && shouldCheck && availability.data && !availability.isPending ? (
                exactTaken ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#F4513B]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F4513B]">
                    Taken
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#88cf08]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#21191D]">
                    <Check className="size-3 text-[#88cf08]" />
                    Available
                  </span>
                )
              ) : null}
            </div>
          </div>

          <p
            id="profile-username-hint"
            className="font-mono text-[10px] text-slate-400"
          >
            3–30 chars: lowercase letters, numbers, _ or .
          </p>

          {/* Format Error Notice */}
          {formatError && (touched || username) ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#F4513B]/30 bg-[#F4513B]/5 px-3 py-2">
              <span className="size-1.5 rounded-full bg-[#F4513B]" />
              <p className="font-mono text-xs font-bold text-[#F4513B]">
                {formatError}
              </p>
            </div>
          ) : null}
        </div>

        {/* Avatar Image URL */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="profile-avatar"
            className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600"
          >
            <span className="flex items-center gap-1.5">
              <Link2 className="size-3.5 text-slate-400" />
              Avatar Image URL
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-slate-400">
                optional
              </span>
            </span>
            {avatarUrl.trim() ? (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#F4513B]"
              >
                Clear
              </button>
            ) : null}
          </Label>

          <div className="flex items-center gap-2">
            <Input
              id="profile-avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              maxLength={500}
              className="h-12 flex-1 rounded-xl border-slate-200 bg-[#f8fafc] px-4 font-mono text-xs text-[#21191D] shadow-none placeholder:text-slate-400 focus-visible:border-[#21191D] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#D5F45B]/40"
            />
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          {dirty ? (
            <Button
              type="button"
              onClick={() => void save()}
              disabled={update.isPending || !!formatError || exactTaken}
              className="h-12 w-full rounded-xl bg-[#21191D] font-mono text-xs font-black uppercase tracking-widest text-[#D5F45B] shadow-md transition-all hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {update.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-[#D5F45B]" />
                  Saving updates…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#D5F45B]" />
                  {submitLabel || (mode === "create" ? "Initialize Handle & Enter →" : "Save Changes")}
                </span>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] font-mono text-xs font-bold uppercase tracking-wider text-slate-500 shadow-none"
            >
              <Check className="size-4 text-[#88cf08]" />
              {mode === "create" ? "Enter Workspace" : "Profile Up To Date"}
            </Button>
          )}

          {footerNote ? <div className="mt-4 text-center">{footerNote}</div> : null}
        </div>
      </div>
    </div>
  );
}
