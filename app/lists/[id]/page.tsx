"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { expenseService } from "@/lib/api/expense.service";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";
import type { RecentExpenseItem, MetaPagination } from "@/types/expense";
import type { ExpenseData } from "@/types/expense";

const PAGE_LIMIT = 10;

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$", JPY: "¥",
};

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOL[currency] ?? currency;
  return `${sym}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 rounded bg-gray-100" style={{ width: `${55 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Stats card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

// ── Inner component (needs useParams) ────────────────────────────────────────
function ListDetailContent() {
  const params = useParams<{ id: string }>();
  const listId = Number(params.id);
  const router = useRouter();

  const [expenses, setExpenses] = useState<RecentExpenseItem[]>([]);
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Derived stats
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currency = expenses[0]?.currency ?? "INR";

  const fetchExpenses = useCallback(
    async (pg: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await expenseService.recentExpenses({
          user_list_id: listId,
          page: pg,
          limit: PAGE_LIMIT,
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
    [listId, router],
  );

  useEffect(() => {
    if (!listId) return;
    // eslint-disable-next-line react-compiler/react-compiler
    fetchExpenses(page);
  }, [fetchExpenses, page, listId]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleExpenseCreated(_e: ExpenseData) {
    // Refresh after adding a new expense
    setPage(1);
    fetchExpenses(1);
  }

  const totalPages = meta?.total_pages ?? 1;
  const totalRecords = meta?.total_records ?? 0;

  // Get list name from first expense
  const listName = expenses[0]?.user_list ?? `List #${listId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="text-xl font-extrabold tracking-tight text-indigo-600">
            Fenmo
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/expenses" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
              All Expenses
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">
            {!loading && expenses.length > 0 ? listName : `List #${listId}`}
          </span>
        </nav>

        {/* Title row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {!loading && expenses.length > 0 ? listName : `List #${listId}`}
            </h1>
            {!loading && meta && (
              <p className="mt-1 text-sm text-gray-500">
                {totalRecords.toLocaleString()} expense{totalRecords !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button onClick={() => setExpenseModalOpen(true)} size="md">
            + Add Expense
          </Button>
        </div>

        {/* Stats row — only when we have data */}
        {!loading && expenses.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total (this page)" value={fmt(totalAmount, currency)} />
            <StatCard label="Expenses (this page)" value={String(expenses.length)} />
            <StatCard label="Total records" value={String(totalRecords)} />
          </div>
        )}

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
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(PAGE_LIMIT)].map((_, i) => <SkeletonRow key={i} />)
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🧾</span>
                        <p className="font-medium text-gray-500">No expenses yet</p>
                        <p className="text-xs text-gray-400">
                          Use the &ldquo;Add Expense&rdquo; button to record your first expense.
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
                      <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">
                        {expense.description || (
                          <span className="italic text-gray-300">No description</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
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
                        <span key={`e-${idx}`} className="px-1 text-gray-400 text-sm self-center">…</span>
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

      {/* Add Expense modal pre-selected to this list */}
      <CreateExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onCreated={handleExpenseCreated}
        defaultListId={listId}
      />
    </div>
  );
}

export default function ListDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Loading…</div>}>
      <ListDetailContent />
    </Suspense>
  );
}
