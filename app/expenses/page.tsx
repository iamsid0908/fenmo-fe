"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { expenseService } from "@/lib/api/expense.service";
import { categoryService } from "@/lib/api/category.service";
import { listService } from "@/lib/api/list.service";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import type { RecentExpenseItem, MetaPagination } from "@/types/expense";
import type { Category } from "@/types/category";
import type { UserList } from "@/types/list";

const PAGE_LIMIT = 10;

// ── Currency emoji / symbol ──────────────────────────────────────────────────
const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
  JPY: "¥",
};

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOL[currency] ?? currency;
  return `${sym}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 rounded bg-gray-100" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Portal-based filter dropdown (avoids sticky-header stacking context) ──────
interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 160),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const dropdown = open
    ? createPortal(
        <ul
          style={style}
          className="rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          <li
            onMouseDown={(e) => { e.preventDefault(); onChange(""); setOpen(false); }}
            className={`cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 ${
              value === "" ? "font-semibold text-indigo-600" : "text-gray-700"
            }`}
          >
            All
          </li>
          {options.map((o) => (
            <li
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); }}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 ${
                value === o.value ? "font-semibold text-indigo-600" : "text-gray-700"
              }`}
            >
              {o.label}
            </li>
          ))}
        </ul>,
        document.body,
      )
    : null;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex min-w-[140px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? selected.label : "All"}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ExpensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters — read initial values from URL so filters are bookmarkable
  const [categoryId, setCategoryId] = useState(searchParams.get("category_id") ?? "");
  const [listId, setListId] = useState(searchParams.get("user_list_id") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));

  // Data
  const [expenses, setExpenses] = useState<RecentExpenseItem[]>([]);
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [categories, setCategories] = useState<Category[]>([]);
  const [lists, setLists] = useState<UserList[]>([]);

  // Track if filters changed to reset to page 1
  const prevFilters = useRef({ categoryId, listId });

  // Load filter options once
  useEffect(() => {
    Promise.all([categoryService.getCategories(), listService.getUserList()])
      .then(([cats, ls]) => {
        setCategories(cats.data ?? []);
        setLists(ls.data ?? []);
      })
      .catch(() => {/* non-critical */});
  }, []);

  // Fetch expenses
  const fetchExpenses = useCallback(
    async (pg: number, catId: string, lstId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await expenseService.recentExpenses({
          page: pg,
          limit: PAGE_LIMIT,
          ...(catId ? { category_id: Number(catId) } : {}),
          ...(lstId ? { user_list_id: Number(lstId) } : {}),
        });
        setExpenses(res.data ?? []);
        setMeta(res.meta ?? null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load expenses.");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  // Re-fetch when page / filters change; reset page when filters change
  useEffect(() => {
    const filtersChanged =
      prevFilters.current.categoryId !== categoryId ||
      prevFilters.current.listId !== listId;

    let activePage = page;
    if (filtersChanged) {
      activePage = 1;
      setPage(1);
      prevFilters.current = { categoryId, listId };
    }

    // Sync URL
    const params = new URLSearchParams();
    if (categoryId) params.set("category_id", categoryId);
    if (listId) params.set("user_list_id", listId);
    if (activePage > 1) params.set("page", String(activePage));
    const qs = params.toString();
    router.replace(`/expenses${qs ? `?${qs}` : ""}`, { scroll: false });

    fetchExpenses(activePage, categoryId, listId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryId, listId]);

  const totalPages = meta?.total_pages ?? 1;
  const totalRecords = meta?.total_records ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="text-xl font-extrabold tracking-tight text-indigo-600">
            Fenmo
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-0.5">
              Expenses
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recent Expenses</h1>
          {!loading && meta && (
            <p className="mt-1 text-sm text-gray-500">
              {totalRecords.toLocaleString()} expense{totalRecords !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <FilterSelect
            label="Filter by Category"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <FilterSelect
            label="Filter by List"
            value={listId}
            onChange={setListId}
            options={lists.map((l) => ({ value: String(l.id), label: l.name }))}
          />
          {(categoryId || listId) && (
            <div className="flex items-end">
              <button
                onClick={() => { setCategoryId(""); setListId(""); }}
                className="text-sm text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">List</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(PAGE_LIMIT)].map((_, i) => <SkeletonRow key={i} />)
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🧾</span>
                        <p className="font-medium text-gray-500">No expenses found</p>
                        <p className="text-xs text-gray-400">
                          {categoryId || listId
                            ? "Try clearing the filters."
                            : "Add your first expense from the dashboard."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-gray-50 transition-colors hover:bg-indigo-50/30"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">
                        {fmt(expense.amount, expense.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                          {expense.category || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {expense.user_list || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">
                        {expense.description || <span className="text-gray-300 italic">No description</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                        {formatDate(expense.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </Button>

                {/* Page number pills */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm self-center">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          className={`min-w-[32px] rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            item === page
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Loading…</div>}>
      <ExpensesContent />
    </Suspense>
  );
}
