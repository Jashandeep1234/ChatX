"use client";

import { getApiClient } from "@/lib/api/client";
import type { UserResponse } from "@/types";

export async function fetchMe(): Promise<UserResponse> {
  const res = await getApiClient().get<UserResponse>("/api/users/me");
  return res.data;
}

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  avatarUrl?: string | null;
}

export async function updateMe(input: UpdateProfileInput): Promise<UserResponse> {
  const res = await getApiClient().patch<UserResponse>("/api/users/me", input);
  return res.data;
}

interface SearchPage {
  content: UserResponse[];
  totalElements?: number;
}

export async function searchUsers(q: string): Promise<UserResponse[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const res = await getApiClient().get<SearchPage | UserResponse[]>(
    "/api/users/search",
    { params: { q: query, page: 0, size: 20 } }
  );
  const data = res.data;
  if (Array.isArray(data)) return data;
  return data.content ?? [];
}
