"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "@/components/profile/profile-form";
import { env } from "@/lib/env";
import { loginWithGoogle } from "@/lib/api/auth";
import { apiErrorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const router = useRouter();
  const googleId = env.googleClientId;
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);

  async function handleGoogle(credential?: string) {
    if (!credential) {
      toast.error("Google sign-in did not return a credential.");
      return;
    }
    try {
      const auth = await loginWithGoogle(credential);
      useAuthStore.getState().setSession(auth.accessToken, auth.user);
      toast.success(`Welcome, ${auth.user.name}!`);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Google login failed. Please try again."));
    }
  }

  return (
    <main className="aurora-bg relative flex min-h-svh items-center justify-center overflow-x-clip p-4 py-8 text-[#21191D] sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 grid-lines opacity-40"
        aria-hidden
      />
      <div className="anim-fade-up relative grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">

        {/* ── Left: info panel ── */}
        <section className="flex flex-col justify-between rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-200/40 sm:p-9">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              [ Return home ]
            </Link>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#D5F45B] font-black shadow-xs">
                <MessagesSquare className="size-5 text-[#21191D]" aria-hidden />
              </span>
              <div>
                <span className="block font-display text-2xl font-black uppercase tracking-tight text-[#21191D]">
                  ChatX<span className="text-[#D5F45B]">_</span>
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#F4513B]">
                  Node auth // Protocol 0.1
                </span>
              </div>
            </div>

            <h1 className="mt-8 font-display text-5xl font-black uppercase leading-[0.98] tracking-tight text-[#21191D] sm:text-6xl">
              {!user ? (
                <>
                  INITIALIZE
                  <br />
                  SESSION
                </>
              ) : (
                <>
                  CLAIM
                  <br />
                  HANDLE
                </>
              )}
            </h1>
            <p className="mt-5 max-w-sm font-mono text-xs font-medium leading-relaxed text-slate-500">
              {!user
                ? "Zero-friction OAuth authentication. Claim an unconventional @handle to join the decentralized mesh."
                : "Choose your unique operator handle. Collaborators locate you across channels via this tag."}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <div className="rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-5 sm:p-6">
              <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#88cf08]">
                <Sparkles className="size-3.5 text-[#88cf08]" aria-hidden /> {"// Onboarding pipeline"}
              </p>
              <ul className="mt-4 flex flex-col gap-3 font-mono text-xs text-slate-700">
                <li className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#D5F45B] text-[11px] font-black text-[#21191D]">
                    01
                  </span>
                  Authorize Google identity token
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#21191D] text-[11px] font-bold text-white">
                    02
                  </span>
                  Claim unique operator @handle
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-200 text-[11px] font-bold text-slate-600">
                    03
                  </span>
                  Establish real-time duplex socket stream
                </li>
              </ul>
            </div>
            <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {"// Stage "}
              {!user ? "01 of 02 : Authentication" : "02 of 02 : Profile activation"}
            </p>
          </div>
        </section>

        {/* ── Right: access protocol / profile form ── */}
        <section className="flex flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40">
          {/* Stage progress bar */}
          <div className="border-b border-slate-100 bg-white px-6 py-4 sm:px-8">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#88cf08]">
                Stage {!user ? "01" : "02"} / 02
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full bg-[#D5F45B] transition-all duration-500",
                    user ? "w-full" : "w-1/2"
                  )}
                />
              </div>
            </div>
          </div>

          {initializing ? (
            <div className="flex flex-1 flex-col gap-4 p-8 sm:p-10" aria-label="Loading">
              <Skeleton className="skeleton-shimmer mx-auto size-12 rounded-xl" />
              <Skeleton className="skeleton-shimmer h-5 w-2/3 self-center rounded-sm" />
              <Skeleton className="skeleton-shimmer h-12 w-full rounded-xl" />
              <Skeleton className="skeleton-shimmer h-12 w-full rounded-xl" />
            </div>
          ) : !user ? (
            /* Stage 01: Google sign-in */
            <div className="flex flex-1 flex-col justify-between">
              <div className="bg-[#21191D] px-6 py-11 text-center text-white sm:px-10">
                <p className="font-display text-2xl font-black uppercase tracking-wider text-white">
                  Access protocol
                </p>
                <p className="mx-auto mt-2 max-w-sm font-mono text-xs font-medium leading-relaxed text-slate-300">
                  Multiplexed duplex streaming. Zero credentials on disk.
                  Ephemeral in-memory session.
                </p>
              </div>

              <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
                {googleId ? (
                  <div className="mx-auto flex w-full max-w-sm items-center justify-center rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-7 shadow-xs">
                    <GoogleLogin
                      onSuccess={(r: CredentialResponse) =>
                        void handleGoogle(r.credential)
                      }
                      onError={() => toast.error("Google sign-in failed.")}
                      useOneTap={false}
                      theme="filled_black"
                      shape="rectangular"
                      text="signin_with"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#F4513B] bg-[#F4513B]/10 px-5 py-4 font-mono text-xs text-[#F4513B]">
                    Google sign-in is not configured. Add{" "}
                    <code className="rounded bg-[#21191D] px-1.5 py-0.5 font-bold text-white">
                      NEXT_PUBLIC_GOOGLE_CLIENT_ID
                    </code>{" "}
                    to `.env.local` to enable login.
                  </div>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 font-mono text-[11px] font-bold tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-[#88cf08]" aria-hidden />
                    HTTPONLY COOKIE
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Lock className="size-4 text-[#F4513B]" aria-hidden />
                    VERIFIED OAUTH
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-4 text-[#88cf08]" aria-hidden />
                    WSS REALTIME
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white py-4 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                By accessing this node, you agree to network standards
              </div>
            </div>
          ) : (
            /* Stage 02: Profile / handle setup */
            <div className="flex-1 overflow-y-auto">
              <ProfileForm
                user={user}
                mode="create"
                submitLabel={
                  user.username ? "Save & enter workspace" : "Claim handle & enter"
                }
                onSaved={() => router.replace("/chat")}
                footerNote={
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-[#21191D]"
                  >
                    Skip for now — proceed to terminal
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                }
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
