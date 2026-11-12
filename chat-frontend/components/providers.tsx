"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";
import { refreshSessionOnce } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/users";
import { useAuthStore } from "@/lib/store/auth-store";
import { stompSingleton } from "@/lib/ws/stomp-client";

let queryClient: QueryClient | null = null;
function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return queryClient;
}

function SessionRestorer({ children }: { children: React.ReactNode }) {
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Silently restore via httpOnly refresh cookie.
      try {
        const ok = await refreshSessionOnce();
        if (ok && !cancelled) {
          try {
            const me = await fetchMe();
            useAuthStore.getState().setUser(me);
          } catch {
            // token ok but /me failed; leave session, pages will show error state
          }
        }
      } catch {
        // no session; login page handles it
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setInitializing]);

  // Keep the socket token fresh whenever it changes.
  const token = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (token) stompSingleton.refreshToken();
  }, [token]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient);
  const googleId = env.googleClientId;
  const inner = (
    <SessionRestorer>
      <TooltipProvider>
        {children}
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </SessionRestorer>
  );
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        {googleId ? (
          <GoogleOAuthProvider clientId={googleId}>{inner}</GoogleOAuthProvider>
        ) : (
          inner
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
