"use client";

import { getApiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import type { AuthResponse } from "@/types";

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  useAuthStore.getState().clearSession();
  const res = await getApiClient().post<AuthResponse>("/api/auth/google", {
    idToken,
  });
  return res.data;
}

export async function refreshNow(): Promise<AuthResponse> {
  const res = await getApiClient().post<AuthResponse>("/api/auth/refresh", {});
  return res.data;
}

export async function logoutNow(): Promise<void> {
  try {
    await getApiClient().post("/api/auth/logout", {});
  } finally {
    useAuthStore.getState().clearSession();
  }
}
