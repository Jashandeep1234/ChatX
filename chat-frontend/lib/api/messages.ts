"use client";

import { getApiClient } from "@/lib/api/client";
import type {
  MessagePageResponse,
  MessageResponse,
  MessageType,
} from "@/types";

const PAGE_SIZE = 30;

export async function fetchMessages(
  conversationId: string,
  cursor?: string | null,
  limit: number = PAGE_SIZE
): Promise<MessagePageResponse> {
  const res = await getApiClient().get<MessagePageResponse>(
    `/api/conversations/${conversationId}/messages`,
    { params: { cursor: cursor ?? undefined, limit } }
  );
  return res.data;
}

export interface SendInput {
  content?: string;
  type?: MessageType;
  replyToId?: string | null;
  attachmentIds?: string[];
  attachments?: import("@/types").AttachmentResponse[];
}

export async function sendMessage(
  conversationId: string,
  input: SendInput
): Promise<MessageResponse> {
  const res = await getApiClient().post<MessageResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      content: input.content,
      type: input.type,
      replyToId: input.replyToId,
      attachmentIds: input.attachmentIds,
    }
  );
  return res.data;
}

export async function editMessage(
  messageId: string,
  content: string
): Promise<MessageResponse> {
  const res = await getApiClient().patch<MessageResponse>(
    `/api/messages/${messageId}`,
    { content }
  );
  return res.data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  await getApiClient().delete(`/api/messages/${messageId}`);
}

export async function markRead(
  conversationId: string,
  messageId: string
): Promise<void> {
  await getApiClient().post(`/api/conversations/${conversationId}/read`, {
    messageId,
  });
}
