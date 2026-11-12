// Shared types mirror backend DTOs (see Backend/src/.../dto).
// Keep in sync with: UserResponse, ConversationResponse, MemberResponse,
// MessageResponse, AttachmentResponse, MessagePageResponse, AuthResponse, WsEvent.

export type ConversationType = "DIRECT" | "GROUP";
export type MemberRole = "ADMIN" | "MEMBER";
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
export type MessageStatus = "SENT" | "DELIVERED" | "READ";

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  online: boolean;
}

export interface MemberResponse {
  userId: string;
  name: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  online: boolean;
}

export interface AttachmentResponse {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string | null;
  content: string | null;
  messageType: MessageType;
  status: MessageStatus;
  replyToId: string | null;
  attachments: AttachmentResponse[];
  deleted: boolean;
  editedAt: string | null;
  createdAt: string;
}

export interface MessagePageResponse {
  messages: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  members: MemberResponse[];
  lastMessage: MessageResponse | null;
  unreadCount: number;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

export interface FileUploadResponse {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

/** STOMP envelope broadcast on /topic/conversation/{id}, /topic/presence, /user/queue/messages. */
export interface WsEvent<T = unknown> {
  type: string;
  conversationId: string | null;
  actorId: string | null;
  payload: T;
  at: string;
}

export const WsEventType = {
  MESSAGE_NEW: "MESSAGE_NEW",
  MESSAGE_EDITED: "MESSAGE_EDITED",
  MESSAGE_DELETED: "MESSAGE_DELETED",
  MESSAGE_READ: "MESSAGE_READ",
  TYPING: "TYPING",
  USER_ONLINE: "USER_ONLINE",
  USER_OFFLINE: "USER_OFFLINE",
  GROUP_UPDATED: "GROUP_UPDATED",
  MEMBER_ADDED: "MEMBER_ADDED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
} as const;

export type WsEventTypeName = (typeof WsEventType)[keyof typeof WsEventType];

/** Client-side extension: optimistic / failed messages. */
export interface ChatMessage extends MessageResponse {
  pending?: boolean;
  failed?: boolean;
  tempId?: string;
}

export interface TypingPayload {
  userId: string;
  typing: boolean;
}

export interface MessageReadPayload {
  conversationId: string;
  messageId: string;
  readerId: string;
}
