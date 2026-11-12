"use client";

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import { useAuthStore } from "@/lib/store/auth-store";

let client: AxiosInstance | null = null;
let refreshing: Promise<string | null> | null = null;
let queue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue(token: string | null, err: unknown) {
  const pending = queue;
  queue = [];
  for (const p of pending) {
    if (err) p.reject(err);
    else p.resolve(token);
  }
}

async function doRefresh(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await axios.post(
        `${env.apiUrl}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const token = res.data?.accessToken as string | undefined;
      const user = res.data?.user;
      if (!token) throw new Error("No access token from refresh");
      const store = useAuthStore.getState();
      store.setSession(token, user ?? store.user ?? null);
      drainQueue(token, null);
      return token;
    } catch (e) {
      drainQueue(null, e);
      useAuthStore.getState().clearSession();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export function getApiClient(): AxiosInstance {
  if (client) return client;
  const instance = axios.create({
    baseURL: env.apiUrl,
    withCredentials: true,
    timeout: 20000,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as (AxiosRequestConfig & {
        _retried?: boolean;
      }) | undefined;
      const status = error.response?.status;
      const url = original?.url ?? "";
      if (
        status === 401 &&
        original &&
        !original._retried &&
        !url.includes("/api/auth/refresh") &&
        !url.includes("/api/auth/google")
      ) {
        original._retried = true;
        try {
          const token = await new Promise<string | null>((resolve, reject) => {
            queue.push({ resolve, reject });
            void doRefresh();
          });
          if (token && original.headers) {
            (original.headers as Record<string, string>)["Authorization"] =
              `Bearer ${token}`;
          }
          return instance(original);
        } catch (e) {
          return Promise.reject(e);
        }
      }
      return Promise.reject(error);
    }
  );

  client = instance;
  return client;
}

export async function refreshSessionOnce(): Promise<boolean> {
  const token = await doRefresh();
  return !!token;
}
