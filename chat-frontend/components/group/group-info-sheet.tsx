"use client";

import { useRef, useState } from "react";
import {
  Crown,
  ImageUp,
  Loader2,
  LogOut,
  Pencil,
  UserMinus,
  UserPlus,
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
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useAddMembers,
  useConversation,
  useRemoveMember,
  useRenameGroup,
  useUpdateGroupAvatar,
  useUpdateMemberRole,
  useUserSearch,
} from "@/hooks/use-chat-queries";
import { uploadFile } from "@/lib/api/files";
import { validateFile } from "@/lib/utils/format";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useAuthStore } from "@/lib/store/auth-store";
import { UserAvatar } from "@/components/common/user-avatar";
import type { ConversationResponse } from "@/types";

function isAdmin(conv: ConversationResponse | undefined, meId?: string | null) {
  if (!conv || !meId) return false;
  return conv.members.some((m) => m.userId === meId && m.role === "ADMIN");
}

export function GroupInfoSheet({
  conversationId,
  open,
  onOpenChange,
}: {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useAuthStore((s) => s.user);
  const convQuery = useConversation(conversationId);
  const conv = convQuery.data;
  const admin = isAdmin(conv, me?.id);
  const rename = useRenameGroup(conversationId ?? "");
  const updateAvatar = useUpdateGroupAvatar(conversationId ?? "");
  const addMembers = useAddMembers(conversationId ?? "");
  const removeMember = useRemoveMember(conversationId ?? "");
  const updateRole = useUpdateMemberRole(conversationId ?? "");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 350);
  const search = useUserSearch(debounced);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function changeAvatar(file: File) {
    const err = validateFile(file);
    if (err || !file.type.startsWith("image/")) {
      toast.error(err ?? "Avatar must be an image.");
      return;
    }
    setAvatarBusy(true);
    try {
      const uploaded = await uploadFile(file);
      await updateAvatar.mutateAsync(uploaded.fileUrl);
      toast.success("Group avatar updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Avatar update failed.");
    } finally {
      setAvatarBusy(false);
    }
  }

  function startRename() {
    setName(conv?.name ?? "");
    setEditing(true);
  }

  async function saveRename() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    try {
      await rename.mutateAsync(name.trim());
      toast.success("Group renamed.");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed.");
    }
  }

  async function doAdd(userId: string) {
    try {
      await addMembers.mutateAsync([userId]);
      toast.success("Member added.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add member.");
    }
  }

  async function doRemove(userId: string) {
    try {
      await removeMember.mutateAsync(userId);
      toast.success(userId === me?.id ? "You left the group." : "Member removed.");
      setConfirmRemove(null);
      if (userId === me?.id) {
        setConfirmLeave(false);
        onOpenChange(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove member.");
    }
  }

  async function toggleRole(userId: string, current: "ADMIN" | "MEMBER") {
    try {
      await updateRole.mutateAsync({
        userId,
        role: current === "ADMIN" ? "MEMBER" : "ADMIN",
      });
      toast.success("Role updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update role.");
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full border-l border-border bg-card p-0 sm:max-w-md">
          <SheetHeader className="shrink-0 gap-1 border-b border-border px-6 py-5 pr-14">
            <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">
              Group info
            </SheetTitle>
            <SheetDescription className="font-mono text-[11px] leading-relaxed">
              Members, roles and admin actions.
            </SheetDescription>
          </SheetHeader>
          {convQuery.isPending ? (
            <p className="flex items-center gap-2 px-6 py-6 font-mono text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-signal" aria-hidden />
              Loading…
            </p>
          ) : !conv ? (
            <p className="px-6 py-6 font-mono text-xs text-muted-foreground">
              Could not load group info.
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-5 px-6 py-5">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                <UserAvatar
                  name={conv.name}
                  avatarUrl={conv.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-black uppercase tracking-tight text-foreground">
                    {conv.name ?? "Group"}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {conv.members.length} member
                    {conv.members.length === 1 ? "" : "s"}
                  </p>
                </div>
                {admin ? (
                  <span className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={startRename}
                      aria-label="Rename group"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={avatarBusy}
                      onClick={() => avatarInputRef.current?.click()}
                      aria-label="Change group avatar"
                      title="Change group avatar"
                    >
                      {avatarBusy ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <ImageUp className="size-4" aria-hidden />
                      )}
                    </Button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      aria-label="Change group avatar"
                      disabled={avatarBusy}
                      tabIndex={-1}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void changeAvatar(f);
                        e.target.value = "";
                      }}
                    />
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {admin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdding((v) => !v)}
                  >
                    <UserPlus className="size-4" aria-hidden /> Add members
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmLeave(true)}
                >
                  <LogOut className="size-4" aria-hidden /> Leave
                </Button>
              </div>

              {adding && admin ? (
                <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search people to add…"
                    aria-label="Search people to add"
                    className="h-10"
                  />
                  <ScrollArea className="max-h-40">
                    <ul className="flex flex-col gap-0.5">
                      {(search.data ?? [])
                        .filter(
                          (u) =>
                            !conv.members.some((m) => m.userId === u.id)
                        )
                        .map((u) => (
                          <li key={u.id}>
                            <button
                              onClick={() => void doAdd(u.id)}
                              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-elevated"
                            >
                              <UserAvatar
                                name={u.name}
                                avatarUrl={u.avatarUrl}
                                online={u.online}
                                size="sm"
                              />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                {u.name}
                              </span>
                              <UserPlus
                                className="size-3.5 text-signal"
                                aria-hidden
                              />
                            </button>
                          </li>
                        ))}
                      {(search.data ?? []).filter(
                        (u) => !conv.members.some((m) => m.userId === u.id)
                      ).length === 0 ? (
                        <li className="px-2 py-3 font-mono text-[11px] text-muted-foreground">
                          Nobody new to add.
                        </li>
                      ) : null}
                    </ul>
                  </ScrollArea>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Members
                </span>
                <span className="font-mono text-[10px] font-bold text-signal">
                  {conv.members.length.toString().padStart(2, "0")}
                </span>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <ul className="flex flex-col gap-0.5 pb-2">
                  {conv.members.map((m) => (
                    <li
                      key={m.userId}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-elevated"
                    >
                      <UserAvatar
                        name={m.name}
                        avatarUrl={m.avatarUrl}
                        online={m.online}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-foreground">
                            {m.name}
                            {m.userId === me?.id ? " (you)" : ""}
                          </span>
                          {m.role === "ADMIN" ? (
                            <Badge className="gap-1 rounded-sm border-0 bg-coal font-mono text-[9px] font-bold uppercase tracking-wider text-bone">
                              <Crown className="size-3 text-acid" aria-hidden />{" "}
                              Admin
                            </Badge>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                          {m.email}
                        </span>
                      </span>
                      {admin && m.userId !== me?.id ? (
                        <span className="flex shrink-0 gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Toggle admin for ${m.name}`}
                            title={
                              m.role === "ADMIN"
                                ? "Demote to member"
                                : "Promote to admin"
                            }
                            onClick={() => void toggleRole(m.userId, m.role)}
                          >
                            <Crown className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Remove ${m.name}`}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirmRemove(m.userId)}
                          >
                            <UserMinus className="size-3.5" aria-hidden />
                          </Button>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-black uppercase tracking-tight">
              Rename group
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              1–255 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label
              htmlFor="rename-input"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Name
            </Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              className="h-11"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={saveRename} disabled={rename.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will stop receiving messages from this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => me?.id && void doRemove(me.id)}
              className="bg-destructive text-bone hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmRemove}
        onOpenChange={(v) => !v && setConfirmRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this group&apos;s history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && void doRemove(confirmRemove)}
              className="bg-destructive text-bone hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
