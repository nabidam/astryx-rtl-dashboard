import { useMemo, useState, useCallback, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type Row,
  type Cell,
  type Header,
} from "@tanstack/react-table";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HStack } from "@astryxdesign/core/Layout";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { VStack } from "@astryxdesign/core/VStack";
import { toPersianDigits } from "../../lib/digits";
import "./DataTable.css";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  accessorKey?: keyof T & string;
  accessorFn?: (row: T) => unknown;
  cell?: (info: { getValue: () => unknown; row: Row<T>; cell: Cell<T, unknown> }) => ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
  enableEditing?: boolean;
  size?: number;
  minSize?: number;
  maxSize?: number;
  meta?: {
    filterVariant?: "text" | "select";
    filterOptions?: Array<{ value: string; label: string }>;
  };
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  title?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  pageSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableEditing?: boolean;
  globalFilterPlaceholder?: string;
  onRowEdit?: (row: T, columnId: string, value: unknown) => void;
  onCreate?: () => void;
  createButtonLabel?: string;
  toolbarExtra?: ReactNode;
};

export function DataTable<T>({
  data,
  columns: columnsProp,
  title,
  emptyStateTitle = "نتیجه‌ای یافت نشد",
  emptyStateDescription = "عبارت جست‌وجو یا فیلترها را تغییر دهید.",
  pageSize: initialPageSize = 10,
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enablePagination = true,
  enableRowSelection = false,
  enableEditing = false,
  globalFilterPlaceholder = "جست‌وجو...",
  onRowEdit,
  onCreate,
  createButtonLabel = "افزودن",
  toolbarExtra,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const tableColumns = useMemo(
    () =>
      columnsProp.map((col) => ({
        id: col.id,
        accessorKey: col.accessorKey,
        accessorFn: col.accessorFn,
        header: col.header,
        cell: col.cell,
        enableSorting: col.enableSorting ?? true,
        enableHiding: col.enableHiding ?? true,
        size: col.size,
        minSize: col.minSize,
        maxSize: col.maxSize,
        meta: col.meta,
      })),
    [columnsProp],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    enableRowSelection,
  });

  const startEditing = useCallback(
    (rowId: string, columnId: string, initialValue: string) => {
      if (!enableEditing) return;
      setEditingCell({ rowId, columnId });
      setEditValue(initialValue);
    },
    [enableEditing],
  );

  const stopEditing = useCallback(
    (save: boolean) => {
      if (save && editingCell && onRowEdit) {
        const row = table
          .getRowModel()
          .rows.find((r) => r.id === editingCell.rowId);
        if (row) {
          const original = row.original;
          onRowEdit(original, editingCell.columnId, editValue);
        }
      }
      setEditingCell(null);
      setEditValue("");
    },
    [editingCell, editValue, onRowEdit, table],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        stopEditing(true);
      } else if (e.key === "Escape") {
        stopEditing(false);
      }
    },
    [stopEditing],
  );

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;
  const totalRows = data.length;
  const filteredRows = table.getFilteredRowModel().rows.length;

  const sortDirection = (header: Header<T, unknown>) => {
    if (!header.column.getIsSorted()) return "none";
    return header.column.getIsSorted() === "asc" ? "up" : "down";
  };

  const columnVisibilityItems = table
    .getAllLeafColumns()
    .filter((col) => col.getCanHide())
    .map((col) => ({
      type: "checkbox" as const,
      label: typeof col.columnDef.header === "string" 
        ? col.columnDef.header 
        : col.id,
      checked: col.getIsVisible(),
      onClick: () => {
        col.toggleVisibility();
      },
    }));

  return (
    <VStack gap={4}>
      <Toolbar
        label={title ? `ابزارهای ${title}` : "ابزارهای جدول"}
        size="sm"
        startContent={
          <HStack gap={2} vAlign="end">
            {enableFiltering && (
              <TextInput
                label="جست‌وجوی سراسری"
                isLabelHidden
                value={globalFilter}
                placeholder={globalFilterPlaceholder}
                hasClear
                onChange={(value) => {
                  setGlobalFilter(value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            )}
            {toolbarExtra}
          </HStack>
        }
        endContent={
          <HStack gap={2} vAlign="end">
            {enableColumnVisibility && columnVisibilityItems.length > 0 && (
              <DropdownMenu
                button={{
                  label: "ستون‌ها",
                  variant: "secondary",
                }}
                items={columnVisibilityItems}
              />
            )}
            {onCreate && (
              <Button
                label={createButtonLabel}
                variant="primary"
                onClick={onCreate}
              />
            )}
          </HStack>
        }
      />

      <VStack gap={0}>
        <table
          role="grid"
          aria-label={title || "جدول داده"}
          className="astryx-table"
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id} className="astryx-table-row">
                {enableRowSelection && (
                  <th className="astryx-table-header-cell">
                    <CheckboxInput
                      label=""
                      isLabelHidden
                      value={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() &&
                          "indeterminate")
                      }
                      onChange={(checked) => {
                        table.toggleAllPageRowsSelected(checked);
                      }}
                    />
                  </th>
                )}
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="astryx-table-header-cell"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <HStack gap={1} vAlign="center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        <span
                          className={header.column.getIsSorted() ? "sort-active" : "sort-inactive"}
                        >
                          {sortDirection(header) === "up" ? "▲" : "▼"}
                        </span>
                      )}
                    </HStack>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="astryx-table-row">
                <td
                  colSpan={
                    table.getAllLeafColumns().length +
                    (enableRowSelection ? 1 : 0)
                  }
                  className="astryx-table-cell"
                >
                  <EmptyState
                    title={emptyStateTitle}
                    description={emptyStateDescription}
                    actions={
                       globalFilter ? (
                        <Button
                          label="پاک‌کردن جست‌وجو"
                          variant="secondary"
                          onClick={() => {
                            setGlobalFilter("");
                          }}
                        />
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="astryx-table-row"
                  data-selected={row.getIsSelected() || undefined}
                >
                   {enableRowSelection && (
                    <td className="astryx-table-cell">
                      <CheckboxInput
                        label=""
                        isLabelHidden
                        value={row.getIsSelected()}
                        onChange={(checked) => {
                          row.toggleSelected(checked);
                        }}
                      />
                    </td>
                  )}
                   {row.getVisibleCells().map((cell) => {
                    const isEditing =
                      editingCell !== null &&
                      editingCell.rowId === row.id &&
                      editingCell.columnId === cell.column.id;
                    const columnDef = cell.column.columnDef as DataTableColumn<T>;
                    const canEdit = enableEditing && columnDef.enableEditing !== false;

                    return (
                      <td
                        key={cell.id}
                        className="astryx-table-cell"
                        onDoubleClick={() => {
                          if (canEdit) {
                            const rawValue = cell.getValue();
                            let value = "";
                            if (rawValue !== null && rawValue !== undefined) {
                              value = typeof rawValue === "string" || typeof rawValue === "number"
                                ? String(rawValue)
                                : JSON.stringify(rawValue);
                            }
                            startEditing(row.id, cell.column.id, value);
                          }
                        }}
                      >
                        {isEditing ? (
                          <TextInput
                            label=""
                            isLabelHidden
                            value={editValue}
                            onChange={(value) => {
                              setEditValue(value);
                            }}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                              stopEditing(true);
                            }}
                            hasAutoFocus
                          />
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </VStack>

      {enablePagination && pageCount > 1 && (
        <HStack hAlign="between" vAlign="center">
          <Text type="supporting" size="sm">
            {toPersianDigits(String(filteredRows))} از{" "}
            {toPersianDigits(String(totalRows))} ردیف
          </Text>
          <Pagination
            label={`صفحه‌بندی: ${toPersianDigits(String(currentPage))} از ${toPersianDigits(String(pageCount))}`}
            page={currentPage}
            onChange={(page) => {
              setPagination((p) => ({ ...p, pageIndex: page - 1 }));
            }}
            totalItems={filteredRows}
            pageSize={pagination.pageSize}
            size="sm"
            variant="compact"
          />
        </HStack>
      )}

      {enableRowSelection && Object.keys(rowSelection).length > 0 && (
        <div className="data-table-selection-bar">
          <Toolbar
            label={`${toPersianDigits(String(Object.keys(rowSelection).length))} ردیف انتخاب شده`}
            size="sm"
          />
        </div>
      )}
    </VStack>
  );
}
