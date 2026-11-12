"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addMembers,
  createDirect,
  createGroup,
  fetchConversation,
  fetchConversations,
  removeMember,
  renameGroup,
  updateGroupAvatar,
  updateMemberRole,
} from "@/lib/api/conversations";
import {
  deleteMessage,
  editMessage,
  fetchMessages,
  markRead,
  sendMessage,
} from "@/lib/api/messages";
import { fetchMe, searchUsers, updateMe } from "@/lib/api/users";
import { useAuthStore } from "@/lib/store/auth-store";
import type { MessagePageResponse } from "@/types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id as string),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useUserSearch(q: string) {
  return useQuery({
    queryKey: ["user-search", q],
    queryFn: () => searchUsers(q),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name?: string;
      username?: string;
      avatarUrl?: string | null;
    }) => updateMe(input),
    onSuccess: (user) => {
      qc.setQueryData(["me"], user);
      useAuthStore.getState().setUser(user);
      void qc.invalidateQueries({ queryKey: ["user-search"] });
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery<MessagePageResponse>({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) =>
      fetchMessages(conversationId as string, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.hasMore ? (last.nextCursor ?? undefined) : undefined,
    enabled: !!conversationId,
    staleTime: 5_000,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      content?: string;
      replyToId?: string | null;
      attachmentIds?: string[];
    }) => sendMessage(conversationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useEditMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      editMessage(id, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => markRead(conversationId, messageId),
    onSuccess: () => {
      // Clear the unread badge optimistically.
      qc.setQueryData<import("@/types").ConversationResponse[]>(
        ["conversations"],
        (old) =>
          old?.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ) ?? old
      );
    },
  });
}

export function useCreateDirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => createDirect(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, memberIds }: { name: string; memberIds: string[] }) =>
      createGroup(name, memberIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useRenameGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renameGroup(id, name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["conversation", id] });
    },
  });
}

export function useUpdateGroupAvatar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (avatarUrl: string) => updateGroupAvatar(id, avatarUrl),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["conversation", id] });
    },
  });
}

export function useAddMembers(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberIds: string[]) => addMembers(id, memberIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["conversation", id] });
    },
  });
}

export function useRemoveMember(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(conversationId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
  });
}

export function useUpdateMemberRole(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "ADMIN" | "MEMBER";
    }) => updateMemberRole(conversationId, userId, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
  });
}
