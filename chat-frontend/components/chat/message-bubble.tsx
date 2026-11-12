"use client";

import { useState } from "react";
import {
  Check,
  CheckCheck,
  Copy,
  Download,
  FileText,
  Pencil,
  Reply,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/common/user-avatar";
import {
  formatFileSize,
  formatMessageTime,
  isImageMime,
} from "@/lib/utils/format";
import type { AttachmentResponse, ChatMessage } from "@/types";

const SENDER_COLORS = [
  "text-signal",
  "text-berry dark:text-peach",
  "text-foreground",
];

function senderColor(senderId: string | null): string {
  if (!senderId) return SENDER_COLORS[0];
  let h = 0;
  for (let i = 0; i < senderId.length; i++) h = (h * 31 + senderId.charCodeAt(i)) >>> 0;
  return SENDER_COLORS[h % SENDER_COLORS.length];
}

function Ticks({ status }: { status: ChatMessage["status"] }) {
  const label = status === "READ" ? "Read" : status === "DELIVERED" ? "Delivered" : "Sent";
  const cls = status === "READ" ? "size-3.5 text-signal opacity-100 transition-colors" : "size-3.5 opacity-65 transition-colors";
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {status === "READ" ? (
          <CheckCheck className={cls} aria-label={label} />
        ) : status === "DELIVERED" ? (
          <CheckCheck className={cls} aria-label={label} />
        ) : (
          <Check className={cls} aria-label={label} />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="rounded-xl font-mono text-[10px]">{label}</TooltipContent>
    </Tooltip>
  );
}

export function FileCard({
  attachment,
  mine,
}: {
  attachment: AttachmentResponse;
  mine?: boolean;
}) {
  return (
    <a
      href={attachment.fileUrl}
      download={attachment.fileName}
      target="_blank"
      rel="noreferrer"
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all duration-150 ${
        mine
          ? "bg-white/10 hover:bg-white/15 text-bone"
          : "bg-elevated hover:bg-elevated/80 text-foreground"
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-md ${
          mine ? "bg-acid text-coal" : "bg-card text-signal shadow-sm"
        }`}
      >
        <FileText className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{attachment.fileName}</span>
        <span
          className={`block font-mono text-[10px] ${mine ? "text-bone/60" : "text-muted-foreground"}`}
        >
          {formatFileSize(attachment.fileSize)}
        </span>
      </span>
      <Download
        className={`size-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100 ${
          mine ? "text-coal" : "text-foreground"
        }`}
        aria-hidden
      />
    </a>
  );
}

export function MessageBubble({
  message,
  mine,
  showSender,
  showAvatar,
  senderAvatarUrl,
  isGroup,
  replyPreview,
  onReply,
  onEdit,
  onDelete,
  onRetry,
  onJumpToReply,
  onPreviewImage,
}: {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  showAvatar?: boolean;
  senderAvatarUrl?: string | null;
  isGroup?: boolean;
  replyPreview?: ChatMessage | null;
  onReply: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage) => void;
  onDelete: (m: ChatMessage) => void;
  onRetry?: (m: ChatMessage) => void;
  onJumpToReply: (id: string) => void;
  onPreviewImage: (url: string, name: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(message.content ?? "");

  function copyText() {
    const text = message.content ?? "";
    if (!text) {
      toast.error("Nothing to copy.");
      return;
    }
    void navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success("Copied to clipboard."))
      .catch(() => toast.error("Could not copy."));
  }

  if (message.messageType === "SYSTEM") {
    return (
      <div className="flex justify-center px-4 py-2">
        <span className="bubble-system">
          {message.deleted ? "This message was deleted" : message.content}
        </span>
      </div>
    );
  }

  const bubble = (
    <div
      id={`msg-${message.id}`}
      aria-label={
        mine
          ? `You said: ${message.content ?? "attachment"}`
          : `${message.senderName ?? "Unknown"} said: ${message.content ?? "attachment"}`
      }
      className={`group anim-msg relative max-w-[86%] scroll-mt-20 px-4 py-3 text-[13.5px] leading-relaxed sm:max-w-[75%] lg:max-w-[65%] ${
        mine ? "bubble-mine" : "bubble-other"
      } ${message.pending ? "opacity-60" : ""} ${message.failed ? "ring-1 ring-destructive/40" : ""} ${message.deleted ? "border-dashed opacity-50" : ""}`}
    >
      {!mine && showSender && isGroup ? (
        <p className={`mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${senderColor(message.senderId)}`}>
          <span className="opacity-60">{"//"}</span> {message.senderName ?? "Operator"}
        </p>
      ) : null}

      {message.replyToId ? (
        <button
          onClick={() => message.replyToId && onJumpToReply(message.replyToId)}
          className={`mb-2 block w-full truncate rounded-md border-l-2 border-signal px-3 py-1.5 text-left text-xs transition-colors ${
            mine
              ? "bg-white/10 hover:bg-white/15 text-bone"
              : "bg-elevated hover:bg-elevated/70 text-foreground"
          }`}
          aria-label="Jump to replied message"
        >
          {replyPreview?.senderName ? (
            <span className={`block truncate font-mono text-[10px] font-bold ${mine ? "text-acid" : "text-signal"}`}>
              {replyPreview.senderId === message.senderId ? (mine ? "You" : (message.senderName ?? "Unknown")) : (replyPreview.senderName ?? "Unknown")}
            </span>
          ) : null}
          {replyPreview ? (
            <span className="block truncate opacity-85 text-xs font-medium">
              {replyPreview.deleted
                ? "This message was deleted"
                : (replyPreview.content ?? "Attachment")}
            </span>
          ) : (
            <span className="opacity-60 text-xs font-mono">Replied message</span>
          )}
        </button>
      ) : null}

      {message.deleted ? (
        <p className="font-mono text-xs italic opacity-60">This message was deleted</p>
      ) : (
        <>
          {message.attachments?.map((a) =>
            isImageMime(a.mimeType) ? (
              <button
                key={a.id}
                onClick={() => onPreviewImage(a.fileUrl, a.fileName)}
                className="mb-2 block overflow-hidden rounded-md ring-1 ring-coal/10"
                aria-label={`Open image ${a.fileName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.fileUrl}
                  alt={a.fileName}
                  className="max-h-64 w-auto rounded-md object-cover transition-transform duration-200 hover:scale-[1.01]"
                  loading="lazy"
                />
              </button>
            ) : (
              <div key={a.id} className="mb-2">
                <FileCard attachment={a} mine={mine} />
              </div>
            )
          )}
          {message.content ? (
            <p className="break-words whitespace-pre-wrap font-sans font-medium">{message.content}</p>
          ) : null}
        </>
      )}

      <span
        className={`mt-1.5 flex items-center justify-end gap-1.5 font-mono text-[10px] tabular-nums ${
          mine ? "text-bone/60" : "text-muted-foreground"
        }`}
      >
        {mine && isGroup ? (
          <Badge className="h-4 border-0 bg-acid px-1.5 font-mono text-[9px] font-black uppercase tracking-wider text-coal">
            YOU
          </Badge>
        ) : null}
        {message.editedAt && !message.deleted ? <span className="italic text-[10px]">edited</span> : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <time className="cursor-default select-none">
                {formatMessageTime(message.createdAt)}
              </time>
            }
          />
          <TooltipContent side="bottom" className="rounded-xl">
            {new Date(message.createdAt).toLocaleString()}
          </TooltipContent>
        </Tooltip>
        {mine ? <Ticks status={message.status} /> : null}
        {message.pending ? (
          <span className="flex items-center gap-1 text-[11px]" aria-label="Sending">
            <span className="typing-dot" style={{ width: 5, height: 5 }} />
            <span className="typing-dot" style={{ width: 5, height: 5, animationDelay: "0.18s" }} />
            <span className="typing-dot" style={{ width: 5, height: 5, animationDelay: "0.36s" }} />
          </span>
        ) : null}
      </span>

      {message.failed && onRetry ? (
        <span className="mt-2 flex items-center gap-2">
          <Badge variant="destructive" className="h-5 text-[10px] font-semibold">
            Failed to send
          </Badge>
          <Button size="xs" variant="ghost" onClick={() => onRetry(message)} className="h-5 px-2">
            <RotateCcw className="size-3" aria-hidden />
            <span className="hidden sm:inline font-medium">Retry</span>
          </Button>
        </span>
      ) : null}

      {!message.deleted && !message.pending ? (
        <span className="absolute -top-2 right-3 hidden gap-1 group-hover:flex">
          <Button
            size="icon-xs"
            variant="secondary"
            aria-label="Reply"
            onClick={() => onReply(message)}
            className="size-8 rounded-md border bg-card/95 shadow-md backdrop-blur"
          >
            <Reply className="size-3.5" aria-hidden />
          </Button>
          {message.content && !message.deleted ? (
            <Button
              size="icon-xs"
              variant="secondary"
              aria-label="Copy message"
              onClick={copyText}
              className="size-8 rounded-md border bg-card/95 shadow-md backdrop-blur"
            >
              <Copy className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </span>
      ) : null}
    </div>
  );

  const menuItems = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Message actions"
            className="size-8 shrink-0 rounded-md opacity-100 transition-opacity focus-visible:opacity-100 sm:size-7 sm:opacity-0 sm:group-hover:opacity-100"
          />
        }
      >
        ⋯
      </DropdownMenuTrigger>
      <DropdownMenuContent align={mine ? "end" : "start"} className="rounded-lg border-border bg-card shadow-xl">
        <DropdownMenuItem onClick={() => onReply(message)} className="flex items-center gap-2">
          <Reply className="size-4" aria-hidden />
          <span>Reply</span>
        </DropdownMenuItem>
        {message.content && !message.deleted ? (
          <DropdownMenuItem onClick={copyText} className="flex items-center gap-2">
            <Copy className="size-4" aria-hidden />
            <span>Copy</span>
          </DropdownMenuItem>
        ) : null}
        {mine && !message.deleted ? (
          <>
            <DropdownMenuItem
              onClick={() => {
                setDraft(message.content ?? "");
                setEditOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Pencil className="size-4" aria-hidden />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setConfirmDelete(true)}
              className="text-destructive flex items-center gap-2"
            >
              <Trash2 className="size-4" aria-hidden />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div
      className={`group flex w-full items-end gap-2 px-3 py-0.5 sm:px-4 ${
        mine ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {!mine ? (
        showAvatar ? (
          <UserAvatar
            name={message.senderName}
            avatarUrl={senderAvatarUrl}
            size="sm"
            className="mb-0.5 shrink-0"
          />
        ) : (
          <span aria-hidden className="w-8 shrink-0" />
        )
      ) : null}
      <ContextMenu>
        <ContextMenuTrigger className="contents">
          {bubble}
        </ContextMenuTrigger>
        <ContextMenuContent className="rounded-lg border-border bg-card shadow-xl">
          <ContextMenuItem onClick={() => onReply(message)} className="flex items-center gap-2">
            <Reply className="size-4" aria-hidden />
            <span>Reply</span>
          </ContextMenuItem>
          {message.content && !message.deleted ? (
            <ContextMenuItem onClick={copyText} className="flex items-center gap-2">
              <Copy className="size-4" aria-hidden />
              <span>Copy</span>
            </ContextMenuItem>
          ) : null}
          {mine && !message.deleted ? (
            <>
              <ContextMenuItem
                onClick={() => {
                  setDraft(message.content ?? "");
                  setEditOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Pencil className="size-4" aria-hidden />
                <span>Edit</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive flex items-center gap-2"
              >
                <Trash2 className="size-4" aria-hidden />
                <span>Delete</span>
              </ContextMenuItem>
            </>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      {menuItems}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-xl border-border bg-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit message</DialogTitle>
          </DialogHeader>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={4000}
            aria-label="Edited message"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim()) {
                  onEdit({ ...message, content: draft.trim() });
                  setEditOpen(false);
                } else {
                  toast.error("Message cannot be empty.");
                }
              }
            }}
            autoFocus
            className="mt-2"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!draft.trim()) {
                  toast.error("Message cannot be empty.");
                  return;
                }
                onEdit({ ...message, content: draft.trim() });
                setEditOpen(false);
              }}
              className="rounded-xl"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-xl border-border bg-card shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be replaced with &quot;This message was deleted&quot; for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(message)}
              className="rounded-md bg-destructive text-bone hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function useReplyJump() {
  return (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-signal");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-signal"), 1800);
    }
  };
}
