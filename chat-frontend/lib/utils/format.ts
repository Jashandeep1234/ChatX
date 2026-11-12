import { format, isToday, isYesterday } from "date-fns";

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return format(d, "HH:mm");
}

export function formatConversationTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd/MM/yyyy");
}

export function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMMM yyyy");
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const v = bytes / Math.pow(1024, i);
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function isImageMime(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith("image/");
}

export const ALLOWED_UPLOAD_MIMES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
] as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return "File is larger than 25 MB.";
  // Executables are never allowed.
  const blocked = ["application/x-msdownload", "application/x-sh"];
  if (blocked.includes(file.type)) return "This file type is not allowed.";
  const allowed = ALLOWED_UPLOAD_MIMES as readonly string[];
  // Allow images generally + explicit allowlist; fall back to extension check
  // when the browser reports an empty/generic mime type.
  if (file.type.startsWith("image/")) return null;
  if (allowed.includes(file.type)) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = ["png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "zip", "mp3", "wav", "mp4"];
  if (!file.type || file.type === "application/octet-stream") {
    return allowedExts.includes(ext) ? null : "This file type is not allowed.";
  }
  return "This file type is not allowed.";
}

export function cnJoin(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
