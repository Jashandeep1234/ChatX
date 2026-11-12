"use client";

import { MessageSquareOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-coal text-bone shadow-sm">
        <MessageSquareOff className="size-5 text-acid" aria-hidden />
      </span>
      <p className="font-display text-base font-black uppercase tracking-tight text-foreground">
        {title}
      </p>
      {description ? (
        <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-lg border border-signal/25 bg-signal/10 text-signal">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <p className="font-display text-base font-black uppercase tracking-tight text-foreground">
        {title}
      </p>
      <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 font-mono text-xs font-bold uppercase tracking-wider interactive-press"
        >
          Try again
        </Button>
      ) : null}
    </div>
  );
}
