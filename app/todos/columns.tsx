"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Task = {
  id: number | string;
  userId: number;
  title: string;
  description: string;
  isCompleted: number | boolean;
};

export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "isCompleted",
    header: "Done",
    cell: (info) =>
      String(info.getValue()) === "1" || info.getValue() === true ? "✔️" : "",
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
    accessorKey: "userId",
    header: "User",
  },
];
