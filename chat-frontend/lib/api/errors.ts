"use client";

import axios from "axios";

/**
 * Turn any API failure into a human-readable message.
 * - Backend 4xx/5xx → use backend's `message` + status code.
 * - No response (backend down / CORS blocked / wrong URL) → say so plainly
 *   instead of a bare "Network Error".
 */
export function apiErrorMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    const data = e.response?.data as { message?: string } | undefined;
    if (status && data?.message) {
      return `${data.message} (${status})`;
    }
    if (status) {
      return `${fallback} (${status})`;
    }
    if (e.request && !e.response) {
      return (
        "Cannot reach the backend at " +
        (e.config?.baseURL ?? "the API URL") +
        ". Is the backend running on :8080, and are you on http://localhost:3000 (not 127.0.0.1)?"
      );
    }
    return e.message || fallback;
  }
  return e instanceof Error ? e.message : fallback;
}
