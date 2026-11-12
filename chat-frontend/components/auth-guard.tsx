"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initializing = useAuthStore((s) => s.initializing);

  const authed = !!user && !!accessToken;

  useEffect(() => {
    if (!initializing && !authed) router.replace("/signin");
  }, [initializing, authed, router]);

  if (initializing) return null;
  if (!authed) return null;
  return <>{children}</>;
}
