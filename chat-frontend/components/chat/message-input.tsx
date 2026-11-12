"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadFile, type UploadProgress } from "@/lib/api/files";
import { useChatStore } from "@/lib/store/chat-store";
import { sendTyping } from "@/lib/ws/use-chat-socket";
import { validateFile } from "@/lib/utils/format";
import type { AttachmentResponse, ChatMessage } from "@/types";

interface PendingUpload {
  id: string;
  file: File;
  percent: number;
  error: string | null;
  done: AttachmentResponse | null;
  controller: AbortController;
}

export function MessageInput({
  conversationId,
  disabled,
  onSend,
}: {
  conversationId: string;
  disabled?: boolean;
  onSend: (input: {
    content: string;
    replyToId: string | null;
    attachments: AttachmentResponse[];
  }) => Promise<void> | void;
}) {
  const replyTo = useChatStore((s) => s.replyTo);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef<number>(0);

  useEffect(() => {
    setValue("");
    setUploads((prev) => {
      prev.forEach((u) => u.controller.abort());
      return [];
    });
    setReplyTo(null);
  }, [conversationId, setReplyTo]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  function emitTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current > 2500) {
      sendTyping(conversationId, true);
      lastTypingSent.current = now;
    }
    if (typingStop.current) clearTimeout(typingStop.current);
    typingStop.current = setTimeout(
      () => sendTyping(conversationId, false),
      2000
    );
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      const err = validateFile(file);
      const controller = new AbortController();
      const pending: PendingUpload = {
        id: `${Date.now()}-${file.name}`,
        file,
        percent: 0,
        error: err,
        done: null,
        controller,
      };
      if (err) {
        toast.error(`${file.name}: ${err}`);
        continue;
      }
      setUploads((prev) => [...prev, pending]);
      void runUpload(pending);
    }
  }

  async function runUpload(p: PendingUpload) {
    const onProgress = (pr: UploadProgress) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === p.id ? { ...u, percent: pr.percent } : u))
      );
    };
    try {
      const done = await uploadFile(p.file, onProgress, p.controller.signal);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === p.id ? { ...u, percent: 100, done, error: null } : u
        )
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setUploads((prev) => prev.filter((u) => u.id !== p.id));
        return;
      }
      setUploads((prev) =>
        prev.map((u) =>
          u.id === p.id
            ? {
                ...u,
                error: e instanceof Error ? e.message : "Upload failed.",
              }
            : u
        )
      );
    }
  }

  const readyAttachments = uploads.filter((u) => u.done).map((u) => u.done as AttachmentResponse);
  const uploading = uploads.some((u) => !u.done && !u.error);

  async function submit() {
    const content = value.trim();
    if ((!content && readyAttachments.length === 0) || sending || uploading) return;
    setSending(true);
    try {
      await onSend({
        content,
        replyToId: replyTo?.id ?? null,
        attachments: readyAttachments,
      });
      setValue("");
      setUploads([]);
      setReplyTo(null);
      sendTyping(conversationId, false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`border-t border-border bg-card/90 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl transition-colors sm:px-5 ${
        dragOver ? "border-signal bg-signal/5" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
    >
      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-signal/30 bg-signal/10 px-3 py-1.5 shadow-sm">
          <span className="h-6 w-1 shrink-0 rounded-full bg-signal" />
          <span className="min-w-0 flex-1 truncate text-xs">
            <span className="font-bold text-foreground">Replying to {replyTo.senderName ?? "message"}</span>{" "}
            <span className="ml-1 text-muted-foreground">
              {replyTo.deleted ? "This message was deleted" : (replyTo.content ?? "Attachment")}
            </span>
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Cancel reply"
            onClick={() => setReplyTo(null)}
            className="rounded-md"
          >
            <X className="size-3" aria-hidden />
          </Button>
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="mb-2 flex flex-col gap-1.5" aria-label="Uploads">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{u.file.name}</span>
                {u.error ? (
                  <span className="text-destructive text-[11px]">{u.error}</span>
                ) : (
                  <Progress value={u.percent} className="mt-1 h-1.5" aria-label={`Upload ${u.percent}%`} />
                )}
              </span>
              {u.done ? (
                <Badge className="h-5 border-0 bg-acid font-mono text-[10px] font-bold text-coal">
                  READY
                </Badge>
              ) : u.error ? (
                <>
                  <Button size="xs" variant="outline" className="rounded-xl font-mono text-[10px] uppercase font-bold" onClick={() => void runUpload(u)}>
                    Retry
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Remove ${u.file.name}`}
                    className="rounded-lg"
                    onClick={() =>
                      setUploads((prev) => prev.filter((x) => x.id !== u.id))
                    }
                  >
                    <X className="size-3" aria-hidden />
                  </Button>
                </>
              ) : (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Cancel upload ${u.file.name}`}
                  className="rounded-lg"
                  onClick={() => {
                    u.controller.abort();
                    setUploads((prev) => prev.filter((x) => x.id !== u.id));
                  }}
                >
                  <X className="size-3" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`flex items-end gap-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xs transition-all focus-within:border-slate-400 focus-within:shadow-md dark:border-[#392B33] dark:bg-[#151115] dark:focus-within:border-[#482B36] ${
        dragOver ? "border-signal bg-signal/5" : ""
      }`}>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          aria-label="Attach files"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Attach file"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="min-h-10 min-w-10 shrink-0 text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <Paperclip className="size-4" aria-hidden />
        </Button>

        <Textarea
          ref={taRef}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            emitTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={
            dragOver ? "Drop assets to stream…" : "Type a message… (Enter to send)"
          }
          aria-label="Message"
          rows={1}
          className="max-h-36 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 text-sm font-medium leading-relaxed text-foreground shadow-none placeholder:font-mono placeholder:text-xs placeholder:text-muted-foreground focus-visible:ring-0"
        />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-sm"
                onClick={() => void submit()}
                disabled={
                  disabled ||
                  sending ||
                  uploading ||
                  (!value.trim() && readyAttachments.length === 0)
                }
                aria-label="Send message"
                className="group min-h-10 min-w-10 shrink-0 rounded-xl bg-coal text-bone hover:bg-coal/90 dark:bg-acid dark:text-coal dark:hover:bg-acid/90 shadow-sm interactive-press disabled:cursor-not-allowed disabled:opacity-30"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SendHorizontal className="size-4 text-acid dark:text-coal transition-transform group-hover:translate-x-0.5" aria-hidden />
                )}
              </Button>
            }
          />
          <TooltipContent side="top">Send (Enter)</TooltipContent>
        </Tooltip>
      </div>

      <p className="mt-2 hidden items-center justify-between px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:flex" aria-hidden>
        <span>
          <kbd className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 font-bold text-foreground">Enter</kbd> send ·{" "}
          <kbd className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 font-bold text-foreground">Shift+Enter</kbd> line break
        </span>
        <span>Up to 25 MB payload</span>
      </p>
      <span className="sr-only" aria-live="polite">
        {uploading ? "Uploading attachments…" : ""}
      </span>
    </div>
  );
}

export type { ChatMessage };
