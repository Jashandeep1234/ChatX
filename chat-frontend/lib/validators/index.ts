import { z } from "zod";

// NOTE: Google sign-in uses a button only — no email/password form, so no
// login schema is needed. Kept schemas are actually used by the UI.

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  memberIds: z.array(z.string()).default([]),
});

export const renameGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, "Message is empty").max(4000),
});

export const sendMessageSchema = z.object({
  content: z.string().max(4000).default(""),
});

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-z0-9_.]+$/,
    "Only lowercase letters, numbers, _ and ."
  );

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  username: usernameSchema,
  avatarUrl: z.string().max(1024).optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type RenameGroupInput = z.infer<typeof renameGroupSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
