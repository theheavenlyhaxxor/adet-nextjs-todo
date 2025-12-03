"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Task } from "./columns";
import { DataTable } from "./data-table";
import { api } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconDotsVertical, IconTrash } from "@tabler/icons-react";
import TodoEditDialog from "./todo-edit-dialog";
import TodoCreateDialog from "./todo-create-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function ClientTodos() {
  const [data, setData] = React.useState<Task[]>([]);
  const [editTask, setEditTask] = React.useState<Task | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteTask, setDeleteTask] = React.useState<Task | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  // columns for react-table — build here so handlers can close over state
  const columns: ColumnDef<Task>[] = React.useMemo(
    () => [
      {
        id: "isCompleted",
        accessorKey: "isCompleted",
        header: "Done",
        cell: ({ getValue, row }) => {
          const val = getValue() as boolean | number;
          const checked =
            val === true || String(val) === "1" || Number(val) === 1;
          return (
            <Checkbox
              checked={checked}
              onCheckedChange={async (next) => {
                // optimistic toggle locally and call backend toggle endpoint
                const id = row.original.id;
                const prevVal = row.original.isCompleted;
                const optimistic = next ? true : 0;
                setData((prev) =>
                  prev.map((p) =>
                    p.id === id ? { ...p, isCompleted: optimistic } : p
                  )
                );
                try {
                  const token =
                    typeof window !== "undefined"
                      ? sessionStorage.getItem("token")
                      : null;
                  const headers = token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined;

                  // Call the backend endpoint that toggles the done status
                  const res = await api.patch(
                    `/task/${id}/done`,
                    {},
                    { headers }
                  );
                  const updated = res?.data ?? null;
                  const updatedVal =
                    updated?.isCompleted ?? updated?.isDone ?? undefined;
                  if (updatedVal !== undefined) {
                    setData((prev) =>
                      prev.map((p) =>
                        p.id === id ? { ...p, isCompleted: updatedVal } : p
                      )
                    );
                  }
                } catch (err: unknown) {
                  const status = (
                    err as { response?: { status?: number; data?: unknown } }
                  )?.response?.status;
                  const serverMsg =
                    (err as { response?: { data?: unknown } })?.response
                      ?.data ?? String(err);
                  console.error("Failed to toggle task:", status, serverMsg);
                  // rollback optimistic change
                  setData((prev) =>
                    prev.map((p) =>
                      p.id === id ? { ...p, isCompleted: prevVal } : p
                    )
                  );
                  if (status === 401) {
                    if (typeof window !== "undefined")
                      sessionStorage.removeItem("token");
                    router.push("/auth/login");
                  }
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
      },
      {
        accessorKey: "description",
        header: "Description",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Actions">
                  <IconDotsVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => {
                    // open edit modal
                    setEditTask(row.original);
                    setEditOpen(true);
                  }}
                >
                  <svg
                    className="size-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                  </svg>{" "}
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    // open delete confirmation dialog
                    setDeleteTask(row.original);
                    setDeleteOpen(true);
                  }}
                >
                  <IconTrash className="size-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  React.useEffect(() => {
    let cancelled = false;

    async function fetchTodos() {
      setLoading(true);
      setError(null);

      try {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("token")
            : null;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        // Try axios api first
        try {
          const res = await api.get("/task", { headers });
          const json = res?.data ?? {};
          const arr = Array.isArray(json)
            ? json
            : json?.data ?? json?.tasks ?? json?.timeseries ?? [];
          const list = (arr as Array<Record<string, unknown>>).map((t) => ({
            id: (t["id"] as number) ?? (t["id"] as string),
            userId:
              (typeof t["userId"] === "number"
                ? (t["userId"] as number)
                : Number(t["userId"])) ?? 0,
            title: String(t["title"] ?? ""),
            description: String(t["description"] ?? ""),
            isCompleted: (() => {
              const v = t["isCompleted"];
              if (typeof v === "boolean") return v as boolean;
              if (typeof v === "number") return v as number;
              const n = Number(v);
              return Number.isNaN(n) ? 0 : n;
            })(),
          })) as Task[];

          if (cancelled) return;
          setData(list);
          setLoading(false);
          return;
        } catch (err: unknown) {
          // If axios reported 401, clear token and redirect to login
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          if (status === 401) {
            if (typeof window !== "undefined")
              sessionStorage.removeItem("token");
            router.push("/auth/login");
            return;
          }

          // fallthrough to try fetch as a fallback
        }

        // Fallback to fetch against same-origin route
        try {
          const token2 =
            typeof window !== "undefined"
              ? sessionStorage.getItem("token")
              : null;
          const headers2: Record<string, string> | undefined = token2
            ? { Authorization: `Bearer ${token2}` }
            : undefined;

          const r = await fetch("/task", { headers: headers2 });
          if (!r.ok) {
            if (r.status === 401) {
              if (typeof window !== "undefined")
                sessionStorage.removeItem("token");
              router.push("/auth/login");
              return;
            }
            throw new Error(`Fetch error: ${r.status}`);
          }
          const json = await r.json();
          const arr = Array.isArray(json)
            ? json
            : json?.data ?? json?.tasks ?? json?.timeseries ?? [];
          const list = (arr as Array<Record<string, unknown>>).map((t) => ({
            id: (t["id"] as number) ?? (t["id"] as string),
            userId:
              (typeof t["userId"] === "number"
                ? (t["userId"] as number)
                : Number(t["userId"])) ?? 0,
            title: String(t["title"] ?? ""),
            description: String(t["description"] ?? ""),
            isCompleted: (() => {
              const v = t["isCompleted"];
              if (typeof v === "boolean") return v as boolean;
              if (typeof v === "number") return v as number;
              const n = Number(v);
              return Number.isNaN(n) ? 0 : n;
            })(),
          })) as Task[];

          if (cancelled) return;
          setData(list);
          setLoading(false);
        } catch (err2) {
          console.error("Failed to fetch /task (client):", err2);
          if (!cancelled) {
            setError("Failed to load tasks");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching tasks:", err);
        if (!cancelled) {
          setError("Failed to load tasks");
          setLoading(false);
        }
      }
    }

    fetchTodos();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) return <div className="p-6">Loading tasks…</div>;
  if (error)
    return <div className="p-6 text-sm text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Todos</h2>
        <Button onClick={() => setCreateOpen(true)}>New Task</Button>
      </div>
      <DataTable columns={columns} data={data} />
      <TodoEditDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTask(null);
        }}
        task={editTask}
        onSaved={(updated) => {
          setData((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }}
      />

      <TodoCreateDialog
        open={createOpen}
        onOpenChange={(o) => setCreateOpen(o)}
        onCreated={(created) => {
          setData((prev) => [created, ...prev]);
        }}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setDeleteTask(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4" />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">No</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                if (!deleteTask) return;
                setDeleting(true);
                try {
                  const token =
                    typeof window !== "undefined"
                      ? sessionStorage.getItem("token")
                      : null;
                  const headers = token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined;
                  await api.delete(`/task/${deleteTask.id}`, { headers });
                  setData((prev) => prev.filter((p) => p.id !== deleteTask.id));
                  setDeleteOpen(false);
                  setDeleteTask(null);
                } catch (err: unknown) {
                  const status = (
                    err as { response?: { status?: number; data?: unknown } }
                  )?.response?.status;
                  const serverMsg =
                    (err as { response?: { data?: unknown } })?.response
                      ?.data ?? String(err);
                  console.error("Failed to delete task:", status, serverMsg);
                  if (status === 401) {
                    if (typeof window !== "undefined")
                      sessionStorage.removeItem("token");
                    router.push("/auth/login");
                    return;
                  }
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
