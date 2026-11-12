"use client";

import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/utils/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* Bold identity tones drawn from the brand palette. */
const TONES = [
  "bg-coal text-bone font-black",
  "bg-signal text-bone font-black",
  "bg-berry text-bone font-black",
  "bg-acid text-coal font-black",
  "bg-coal text-acid border border-berry font-black",
  "bg-peach text-coal font-black",
  "bg-gold text-coal font-black",
];

function toneFor(name: string | null | undefined) {
  if (!name) return TONES[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function UserAvatar({
  name,
  avatarUrl,
  online,
  className,
  size = "default",
}: {
  name: string | null | undefined;
  avatarUrl?: string | null;
  online?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 select-none", className)}>
      <Avatar
        size={size}
        className="rounded-lg border border-border/80 shadow-sm transition-transform duration-150 group-hover:scale-[1.02]"
      >
        {avatarUrl ? (
          <AvatarImage
            src={avatarUrl}
            alt={name ?? "User"}
            className="rounded-lg object-cover"
          />
        ) : null}
        <AvatarFallback
          aria-label={name ?? "User"}
          className={cn("rounded-lg font-mono text-xs font-bold tracking-wider", toneFor(name))}
        >
          {initialsOf(name)}
        </AvatarFallback>
      </Avatar>
      {typeof online === "boolean" ? (
        <span
          aria-label={online ? "Online" : "Offline"}
          className={cn(
            "absolute -right-0.5 -bottom-0.5 rounded-full border-2 border-card transition-colors duration-200",
            size === "sm" ? "size-2.5" : "size-3",
            online
              ? "bg-success shadow-[0_0_8px_rgba(136,207,8,0.9)]"
              : "bg-muted-foreground/40"
          )}
        />
      ) : null}
    </span>
  );
}
