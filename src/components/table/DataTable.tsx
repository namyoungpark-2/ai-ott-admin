"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button, Input, cx } from "@/components/ui";

type Density = "comfortable" | "compact";

type RowAction<T> = {
  label: string;
  onClick: (row: T) => void | Promise<void>;
  tone?: "default" | "danger";
  disabled?: (row: T) => boolean;
};

export type DataTableProps<T extends object> = {
  title?: string;
  description?: string;
  data: T[];
  columns: ColumnDef<T, any>[];

  /** global search placeholder */
  searchPlaceholder?: string;
  /** global filter: how to stringify a row to search */
  globalSearchText?: (row: T) => string;

  /** optional row actions shown per row (… menu) */
  rowActions?: RowAction<T>[];

  /** optional bulk actions for selected rows */
  bulkActions?: {
    label: string;
    onClick: (rows: T[]) => void | Promise<void>;
    tone?: "default" | "danger";
  }[];

  /** initial config */
  initialPageSize?: number;
  initialDensity?: Density;
};

function useOnClickOutside<T extends HTMLElement>(ref: React.RefObject<T | null>, cb: () => void) {
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      cb();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, cb]);
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-zinc-600">
      {children}
    </kbd>
  );
}

function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </div>
      {open ? (
        <div
          className={cx(
            "absolute z-50 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white shadow-sm",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "w-full px-3 py-2 text-left text-sm transition",
        "hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none",
        danger ? "text-red-600" : "text-zinc-900"
      )}
    >
      {children}
    </button>
  );
}

export function DataTable<T extends object>(props: DataTableProps<T>) {
  const {
    title,
    description,
    data,
    columns,
    rowActions,
    bulkActions,
    searchPlaceholder = "Search…",
    globalSearchText,
    initialPageSize = 20,
    initialDensity = "comfortable",
  } = props;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [density, setDensity] = React.useState<Density>(initialDensity);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const q = String(filterValue).toLowerCase().trim();
      const txt =
        globalSearchText?.(row.original) ??
        Object.values(row.original as any)
          .join(" ")
          .toString();
      return String(txt).toLowerCase().includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    initialState: {
      pagination: { pageSize: initialPageSize, pageIndex: 0 },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasSelection = selectedRows.length > 0;

  const rowPad = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
      {/* Header */}
      <div className="p-6 pb-3 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            {title ? <div className="text-lg font-bold tracking-tight">{title}</div> : null}
            {description ? <div className="mt-1 text-sm text-zinc-500">{description}</div> : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-500 hidden md:flex items-center gap-2">
              <span>Tips:</span>
              <Kbd>Shift</Kbd>+Click (sort)
            </div>

            <Dropdown
              trigger={
                <Button className="h-9" tone="secondary">
                  Columns
                </Button>
              }
            >
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-zinc-500">Visible columns</div>
                <div className="mt-1 max-h-72 overflow-auto">
                  {table.getAllLeafColumns().map((col) => {
                    const canHide = col.getCanHide();
                    return (
                      <label
                        key={col.id}
                        className={cx(
                          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-zinc-50",
                          !canHide && "opacity-60"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          disabled={!canHide}
                          checked={col.getIsVisible()}
                          onChange={col.getToggleVisibilityHandler()}
                        />
                        <span className="truncate">{col.id}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </Dropdown>

            <Button
              className="h-9"
              tone="secondary"
              onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
            >
              Density: {density === "compact" ? "Compact" : "Comfortable"}
            </Button>
          </div>
        </div>

        {/* Search + Bulk actions */}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1">
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>

          {hasSelection && bulkActions?.length ? (
            <div className="flex items-center gap-2">
              <div className="text-sm text-zinc-600">
                Selected <b>{selectedRows.length}</b>
              </div>
              {bulkActions.map((a) => (
                <Button
                  key={a.label}
                  className="h-10"
                  tone={a.tone === "danger" ? "danger" : "secondary"}
                  onClick={() => a.onClick(selectedRows)}
                >
                  {a.label}
                </Button>
              ))}
              <Button className="h-10" tone="secondary" onClick={() => table.resetRowSelection()}>
                Clear
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-zinc-200/70">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-zinc-200/70">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted(); // false | 'asc' | 'desc'
                    return (
                      <th
                        key={header.id}
                        className={cx(
                          "px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500",
                          header.column.id === "__select" && "w-10",
                          header.column.id === "__actions" && "w-12"
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cx(
                              "inline-flex items-center gap-1",
                              canSort && "cursor-pointer select-none"
                            )}
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                            title={canSort ? "Sort" : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDir === "asc" ? <span>▲</span> : null}
                            {sortDir === "desc" ? <span>▼</span> : null}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getAllLeafColumns().length} className="px-6 py-10 text-center">
                    <div className="text-sm font-semibold">No results</div>
                    <div className="mt-1 text-sm text-zinc-500">
                      Try adjusting filters or search keywords.
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className={cx(
                        "border-b border-zinc-200/60 hover:bg-zinc-50/60 transition",
                        row.getIsSelected() && "bg-zinc-50"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        // Row actions cell
                        if (cell.column.id === "__actions") {
                          const actions = rowActions ?? [];
                          return (
                            <td key={cell.id} className={cx("px-4", rowPad, "text-right")}>
                              {actions.length ? (
                                <Dropdown
                                  trigger={
                                    <button
                                      className="h-8 w-8 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50"
                                      aria-label="Row actions"
                                    >
                                      ⋯
                                    </button>
                                  }
                                >
                                  <div className="py-1">
                                    {actions.map((a) => {
                                      const disabled = a.disabled?.(row.original) ?? false;
                                      return (
                                        <MenuItem
                                          key={a.label}
                                          disabled={disabled}
                                          danger={a.tone === "danger"}
                                          onClick={() => a.onClick(row.original)}
                                        >
                                          {a.label}
                                        </MenuItem>
                                      );
                                    })}
                                  </div>
                                </Dropdown>
                              ) : null}
                            </td>
                          );
                        }

                        return (
                          <td key={cell.id} className={cx("px-4", rowPad, "align-middle")}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
          <div className="text-sm text-zinc-600">
            Showing{" "}
            <b>
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </b>{" "}
            –{" "}
            <b>
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </b>{" "}
            of <b>{table.getFilteredRowModel().rows.length}</b>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-9"
              tone="secondary"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              « First
            </Button>
            <Button
              className="h-9"
              tone="secondary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              ‹ Prev
            </Button>

            <div className="text-sm text-zinc-600 px-2">
              Page <b>{table.getState().pagination.pageIndex + 1}</b> /{" "}
              <b>{table.getPageCount()}</b>
            </div>

            <Button
              className="h-9"
              tone="secondary"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next ›
            </Button>
            <Button
              className="h-9"
              tone="secondary"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              Last »
            </Button>

            <select
              className="h-9 rounded-xl border border-zinc-200 bg-white px-2 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
