import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function Table({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
      <table className={`data-table ${className}`}>
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}
export function FilterTabs<T extends string>({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  items: readonly { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="filter-tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={item.value === value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="tab-count">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
export function usePagination<T>(
  rows: T[],
  filterKey: string,
  pageSizeDefault = 10,
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  useEffect(() => setPage(1), [filterKey, pageSize]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  return {
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pages,
    pageSize,
    total: rows.length,
    setPage,
    setPageSize,
  };
}
interface PaginationProps {
  page: number;
  pages: number;
  pageSize: number;
  total: number;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
}
export function Pagination({
  page,
  pages,
  pageSize,
  total,
  setPage,
  setPageSize,
}: PaginationProps) {
  const id = useId();
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="pagination">
      <span role="status">
        {first}–{last} of {total}
      </span>
      <div className="pagination-controls">
        <label htmlFor={id}>Rows per page</label>
        <select
          id={id}
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[10, 25, 50].map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
        <button
          className="icon-btn"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button
          className="icon-btn"
          aria-label="Next page"
          disabled={page === pages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
