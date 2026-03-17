"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { cx } from "@/components/ui";

export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "__select",
    header: ({ table }) => (
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}

export function actionsColumn<T>(): ColumnDef<T> {
  return {
    id: "__actions",
    header: () => <span className={cx("sr-only")}>Actions</span>,
    cell: () => null,
    enableSorting: false,
    enableHiding: false,
    size: 48,
  };
}
