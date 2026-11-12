"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MessagesSquare, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="chat-canvas flex flex-1 flex-col items-center justify-center p-8 text-center"
    >
      <span className="grid size-14 place-items-center rounded-lg border border-signal/30 bg-signal/10 text-signal shadow-[0_0_28px_-10px_rgba(217,79,79,0.8)]">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <p className="mt-5 font-display text-2xl font-black uppercase tracking-tight text-balance">
        Something went wrong
      </p>
      <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
        {error.message || "Could not load this view."}
      </p>
      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">
        <Button size="sm" onClick={reset} className="h-10 px-5">
          Try again
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10 bg-card px-5"
          render={
            <Link href="/chat">
              <MessagesSquare className="size-4" aria-hidden />
              Back to chats
            </Link>
          }
        />
      </div>
    </div>
  );
}
