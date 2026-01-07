"use client";

import * as React from "react";
import { Search, X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StaggerList, StaggerItem } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, TableRowSkeleton } from "@/components/ui/skeleton";

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
  }[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  renderMobileCard?: (item: T) => React.ReactNode;
  className?: string;
  toolbar?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Search...",
  searchKey,
  filters,
  loading = false,
  emptyTitle = "No results found",
  emptyDescription,
  onRowClick,
  renderMobileCard,
  className,
  toolbar,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<
    Record<string, string>
  >({});
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  // Filter and search data
  const filteredData = React.useMemo(() => {
    let result = [...data];

    // Apply search
    if (search && searchKey) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (value) {
        result = result.filter((item) => String(item[key]) === value);
      }
    }

    // Apply sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, searchKey, activeFilters, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const clearFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {searchKey && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {filters && filters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {filters.map((filter) => (
                  <DropdownMenu key={filter.key}>
                    <DropdownMenuTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-muted">
                      {filter.label}
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                      {filter.options.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() =>
                            setActiveFilters((prev) => ({
                              ...prev,
                              [filter.key]: option.value,
                            }))
                          }
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {toolbar}
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters?.find((f) => f.key === key);
            const option = filter?.options.find((o) => o.value === value);
            return (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {filter?.label}: {option?.label ?? value}
                <button
                  onClick={() => clearFilter(key)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <button
            onClick={() => setActiveFilters({})}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {filteredData.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          variant={search ? "search" : "default"}
        />
      ) : (
        <>
          {/* Mobile card view */}
          {renderMobileCard && (
            <StaggerList className="space-y-3 lg:hidden">
              {filteredData.map((item) => (
                <StaggerItem
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "rounded-2xl border border-border/50 bg-card p-4",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                >
                  {renderMobileCard(item)}
                </StaggerItem>
              ))}
            </StaggerList>
          )}

          {/* Desktop table view */}
          <div
            className={cn(
              "overflow-x-auto rounded-2xl border border-border/50 bg-card",
              renderMobileCard ? "hidden lg:block" : "block"
            )}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        col.hideOnMobile && "hidden md:table-cell",
                        col.sortable && "cursor-pointer hover:text-foreground",
                        col.className
                      )}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.header}
                        {col.sortable && sortKey === col.key && (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className={cn(
                      "transition-colors",
                      onRowClick &&
                        "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-sm",
                          col.hideOnMobile && "hidden md:table-cell",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(item)
                          : String(item[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
