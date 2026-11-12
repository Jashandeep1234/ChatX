"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useCreateGroup, useUserSearch } from "@/hooks/use-chat-queries";
import { useAuthStore } from "@/lib/store/auth-store";
import { uploadFile } from "@/lib/api/files";
import { validateFile } from "@/lib/utils/format";
import { UserAvatar } from "@/components/common/user-avatar";

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const debounced = useDebouncedValue(q, 350);
  const search = useUserSearch(debounced);
  const createGroup = useCreateGroup();
  const router = useRouter();
  const tooShort = debounced.trim().length < 2;
  const me = useAuthStore((s) => s.user);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setName("");
      setQ("");
      setSelected([]);
      setAvatarFile(null);
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
    document.addEventListener("chatx-open-create-group", onOpen);
    return () =>
      document.removeEventListener("chatx-open-create-group", onOpen);
  }, []);

  const candidates = useMemo(
    () => (search.data ?? []).filter((u) => u.id !== me?.id),
    [search.data, me?.id]
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit() {
    if (name.trim().length < 3) {
      toast.error("Group name needs at least 3 characters.");
      return;
    }
    if (selected.length === 0) {
      toast.error("Pick at least 1 member for the group.");
      return;
    }
    try {
      const conv = await createGroup.mutateAsync({
        name: name.trim(),
        memberIds: selected,
      });
      // Optional avatar: upload then patch the group.
      if (avatarFile) {
        try {
          const uploaded = await uploadFile(avatarFile);
          const { updateGroupAvatar } = await import("@/lib/api/conversations");
          await updateGroupAvatar(conv.id, uploaded.fileUrl);
        } catch {
          toast.error("Group created, but avatar upload failed.");
        }
      }
      toast.success(`Group "${conv.name}" created.`);
      setOpen(false);
      router.push(`/chat/${conv.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create group.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-display text-xl font-black uppercase tracking-tight">
            Create group
          </DialogTitle>
          <DialogDescription className="font-mono text-xs leading-relaxed">
            Name the group and pick members by @username.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
            <UserAvatar name={name || "Group"} avatarUrl={avatarPreview} size="lg" />
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Label
                htmlFor="group-avatar"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Avatar (optional)
              </Label>
              <label
                htmlFor="group-avatar"
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-elevated"
              >
                <Upload className="size-3.5 text-signal" aria-hidden />
                Choose image
              </label>
              <Input
                id="group-avatar"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (!f) {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    return;
                  }
                  const err = validateFile(f);
                  if (err || !f.type.startsWith("image/")) {
                    toast.error(err ?? "Avatar must be an image.");
                    e.target.value = "";
                    return;
                  }
                  setAvatarFile(f);
                  setAvatarPreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return URL.createObjectURL(f);
                  });
                }}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="group-name"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Group name
            </Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Squad"
              maxLength={255}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="group-search"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Add members
            </Label>
            <Input
              id="group-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by @username…"
              className="h-11"
            />
          </div>

          <ScrollArea className="max-h-56 rounded-lg border border-border">
            <ul className="flex flex-col p-2">
              {search.isPending && !tooShort ? (
                <li className="flex items-center gap-2 p-3 font-mono text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-signal" aria-hidden />
                  Searching…
                </li>
              ) : tooShort ? (
                <li className="p-3 font-mono text-xs text-muted-foreground">
                  Type at least 2 characters to find people.
                </li>
              ) : candidates.length === 0 ? (
                <li className="p-3 font-mono text-xs text-muted-foreground">
                  No people found. Ask them to sign in with Google first.
                </li>
              ) : (
                candidates.map((u) => {
                  const checked = selected.includes(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => toggle(u.id)}
                        aria-pressed={checked}
                        className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                          checked ? "bg-acid/10" : "hover:bg-elevated"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`grid size-4 shrink-0 place-items-center rounded-sm border transition-colors ${
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-card"
                          }`}
                        >
                          {checked ? <Check className="size-3" /> : null}
                        </span>
                        <UserAvatar
                          name={u.name}
                          avatarUrl={u.avatarUrl}
                          online={u.online}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                            <span className="truncate">{u.name}</span>
                            {checked ? (
                              <Check className="size-4 text-signal" aria-label="Selected" />
                            ) : null}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">
                            {u.email}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </ScrollArea>

          {selected.length > 0 ? (
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {selected.length} member{selected.length === 1 ? "" : "s"} selected
            </p>
          ) : null}
        </div>

        <DialogFooter className="flex-col border-t border-border bg-background px-6 py-4 sm:flex-row">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createGroup.isPending}>
            {createGroup.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Create group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
