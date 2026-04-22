"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CreateListModal } from "@/components/lists/CreateListModal";
import { ListCard } from "@/components/lists/ListCard";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";
import { listService } from "@/lib/api/list.service";
import { ApiError } from "@/lib/api/client";
import type { CreateUserListData, UserListExpenseSummary } from "@/types/list";
import type { ExpenseData } from "@/types/expense";

const PAGE_LIMIT = 12;

export default function DashboardPage() {
  const router = useRouter();

  const [lists, setLists] = useState<UserListExpenseSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const fetchLists = useCallback(
    async (pageNum: number, replace = false) => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await listService.getUserListExpenses({
          page: pageNum,
          limit: PAGE_LIMIT,
        });
        const incoming = res.data ?? [];
        setLists((prev) => (replace ? incoming : [...prev, ...incoming]));
        setHasMore(incoming.length === PAGE_LIMIT);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setFetchError(
          err instanceof ApiError
            ? err.message
            : "Failed to load lists. Please try again.",
        );
      } finally {
        setFetchLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    fetchLists(1, true);
  }, [fetchLists]);

  function handleCreated(created: CreateUserListData) {
    // Prepend the new list as a summary (total_expense starts at 0)
    const summary: UserListExpenseSummary = {
      id: 0, // backend doesn't return id in create response; refetch to sync
      name: created.name,
      description: created.description,
      total_expense: 0,
    };
    setLists((prev) => [summary, ...prev]);
    // Refetch page 1 to get proper id from backend
    fetchLists(1, true);
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLists(nextPage);
  }

  function handleExpenseCreated(_expense: ExpenseData) {
    // Refresh list totals so cards reflect the new expense
    fetchLists(1, true);
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 animate-pulse">
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="h-3 w-full rounded bg-gray-200" />
      <div className="h-3 w-1/2 rounded bg-gray-200" />
      <div className="mt-1 h-5 w-1/3 rounded-full bg-gray-200" />
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Top nav */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <span className="text-xl font-extrabold tracking-tight text-indigo-600">
              Fenmo
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/expenses"
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Expenses
              </Link>
              <Button
                variant="secondary"
                onClick={() => setExpenseModalOpen(true)}
                size="md"
              >
                Add Expense
              </Button>
              <Button
                onClick={() => setModalOpen(true)}
                size="md"
              >
                Create List
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8">
          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your expense lists and track spending.
            </p>
          </div>

          {/* Error state */}
          {fetchError && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between"
            >
              {fetchError}
              <button
                onClick={() => fetchLists(1, true)}
                className="ml-4 text-xs font-medium underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Grid */}
          {!fetchLoading && lists.length === 0 && !fetchError ? (
            // Empty state
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h2 className="text-base font-semibold text-gray-700">
                No lists yet
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Create your first list to start tracking expenses.
              </p>
              <Button
                onClick={() => setModalOpen(true)}
                size="md"
                className="mt-6"
              >
                Create List
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lists.map((list, idx) => (
                  <ListCard
                    key={list.id || idx}
                    list={list}
                    onClick={() => router.push(`/lists/${list.id}`)}
                  />
                ))}
                {fetchLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={`sk-${i}`} />
                  ))}
              </div>

              {/* Load more */}
              {!fetchLoading && hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={handleLoadMore}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <CreateListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <CreateExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onCreated={handleExpenseCreated}
      />
    </>
  );
}
