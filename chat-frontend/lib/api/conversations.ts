"use client";

import { getApiClient } from "@/lib/api/client";
import type { ConversationResponse } from "@/types";

export async function fetchConversations(): Promise<ConversationResponse[]> {
  const res = await getApiClient().get<ConversationResponse[]>(
    "/api/conversations"
  );
  return res.data;
}

export async function fetchConversation(id: string): Promise<ConversationResponse> {
  const res = await getApiClient().get<ConversationResponse>(
    `/api/conversations/${id}`
  );
  return res.data;
}

export async function createDirect(userId: string): Promise<ConversationResponse> {
  const res = await getApiClient().post<ConversationResponse>(
    "/api/conversations/direct",
    { userId }
  );
  return res.data;
}

export async function createGroup(
  name: string,
  memberIds: string[]
): Promise<ConversationResponse> {
  const res = await getApiClient().post<ConversationResponse>(
    "/api/conversations/group",
    { name, memberIds }
  );
  return res.data;
}

export async function renameGroup(
  id: string,
  name: string
): Promise<ConversationResponse> {
  const res = await getApiClient().patch<ConversationResponse>(
    `/api/conversations/${id}`,
    { name }
  );
  return res.data;
}

export async function updateGroupAvatar(
  id: string,
  avatarUrl: string
): Promise<ConversationResponse> {
  const res = await getApiClient().patch<ConversationResponse>(
    `/api/conversations/${id}`,
    { avatarUrl }
  );
  return res.data;
}

export async function addMembers(
  id: string,
  memberIds: string[]
): Promise<ConversationResponse> {
  const res = await getApiClient().post<ConversationResponse>(
    `/api/conversations/${id}/members`,
    { memberIds }
  );
  return res.data;
}

export async function removeMember(
  conversationId: string,
  userId: string
): Promise<void> {
  await getApiClient().delete(
    `/api/conversations/${conversationId}/members/${userId}`
  );
}

export async function updateMemberRole(
  conversationId: string,
  userId: string,
  role: "ADMIN" | "MEMBER"
): Promise<ConversationResponse> {
  const res = await getApiClient().patch<ConversationResponse>(
    `/api/conversations/${conversationId}/members/${userId}`,
    { role }
  );
  return res.data;
}
