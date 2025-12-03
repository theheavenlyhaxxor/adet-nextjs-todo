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
  task: Task | null;
  onSaved: (updated: Task) => void;
};

export default function TodoEditDialog({
  open,
  onOpenChange,
  task,
  onSaved,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (task) {
      setTitle(task.title ?? "");
      setDescription(task.description ?? "");
    }
  }, [task]);

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!task) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const mask = (t: string | null) =>
        t ? `${t.slice(0, 6)}...${t.slice(-4)}` : null;
      const maskToken = mask(token);
      const bodyStr = JSON.stringify({ title, description });
      console.debug(
        `[TODO EDIT] PATCH /task/${task.id} headers=${maskToken} body=${bodyStr}`
      );
      const res = await api.patch(
        `/task/${task.id}`,
        { title, description },
        { headers }
      );
      const updated = (res?.data as unknown) ?? { ...task, title, description };
      const updatedObj = updated as Record<string, unknown>;
      const rawIsCompleted = updatedObj["isCompleted"] ?? task.isCompleted;
      const isCompletedFinal =
        typeof rawIsCompleted === "boolean" ||
        typeof rawIsCompleted === "number"
          ? (rawIsCompleted as boolean | number)
          : task.isCompleted;
      const out: Task = {
        id: (updatedObj["id"] as number | string | undefined) ?? task.id,
        userId: (updatedObj["userId"] as number) ?? task.userId,
        title: String(updatedObj["title"] ?? title),
        description: String(updatedObj["description"] ?? description),
        isCompleted: isCompletedFinal,
      };
      onSaved(out);
      onOpenChange(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const serverMsg =
        (err as { response?: { data?: unknown } })?.response?.data ??
        (err as Error)?.message ??
        String(err);
      console.error("Failed to save task:", status, serverMsg);
      setErrorMsg(
        typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)
      );
      if (status === 401) {
        if (typeof window !== "undefined") sessionStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }
      // keep dialog open so user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Edit the title and description of the task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label htmlFor="todo-title">Title</Label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="todo-desc">Description</Label>
            <Input
              id="todo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
        {errorMsg && (
          <div className="text-sm text-red-500 mt-2">Error: {errorMsg}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
