"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Task } from "./columns";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: Task) => void;
};

export default function TodoCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setSaving(false);
    }
  }, [open]);

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const mask = (t: string | null) =>
        t ? `${t.slice(0, 6)}...${t.slice(-4)}` : null;
      console.debug("[TODO CREATE] POST /task", {
        headers: { Authorization: mask(token) },
        body: { title, description },
      });
      const res = await api.post("/task", { title, description }, { headers });
      const created = (res?.data as unknown) ?? {
        id: undefined,
        title,
        description,
      };
      const createdObj = created as Record<string, unknown>;
      const rawIsCompleted = createdObj["isCompleted"];
      const isCompletedFinal =
        typeof rawIsCompleted === "boolean" ||
        typeof rawIsCompleted === "number"
          ? (rawIsCompleted as boolean | number)
          : 0;

      const out: Task = {
        id:
          (createdObj["id"] as number | string | undefined) ??
          Math.random().toString(36).slice(2, 9),
        userId: (createdObj["userId"] as number) ?? 0,
        title: String(createdObj["title"] ?? title),
        description: String(createdObj["description"] ?? description),
        isCompleted: isCompletedFinal,
      };
      onCreated(out);
      onOpenChange(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const serverMsg =
        (err as { response?: { data?: unknown } })?.response?.data ??
        (err as Error)?.message ??
        String(err);
      // log full response for debugging (not the token itself)
      console.debug("[TODO CREATE] error", { status, serverMsg, err });
      console.error("Failed to create task:", status, serverMsg);
      setErrorMsg(
        typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)
      );
      if (status === 401) {
        if (typeof window !== "undefined") sessionStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Create a new task with title and optional description.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="text-sm text-red-500 mt-2">Error: {errorMsg}</div>
        )}
        <form onSubmit={handleCreate} className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label htmlFor="new-todo-title">Title</Label>
            <Input
              id="new-todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="new-todo-desc">Description</Label>
            <Input
              id="new-todo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
