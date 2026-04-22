"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { listService } from "@/lib/api/list.service";
import { categoryService } from "@/lib/api/category.service";
import { expenseService } from "@/lib/api/expense.service";
import { ApiError } from "@/lib/api/client";
import type { UserList } from "@/types/list";
import type { Category } from "@/types/category";
import type { ExpenseData } from "@/types/expense";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (expense: ExpenseData) => void;
  /** Pre-select a list if opened from a specific list page */
  defaultListId?: number;
}

const TODAY = new Date().toISOString().slice(0, 10);

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY"];

// ── Tiny inline combobox for list / category ──────────────────────────────────
interface SelectOrCreateProps {
  label: string;
  placeholder: string;
  items: { id: number; name: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => Promise<void>;
  createLabel: string;
  loading: boolean;
  error?: string;
}

function SelectOrCreate({
  label,
  placeholder,
  items,
  selectedId,
  onSelect,
  onCreate,
  createLabel,
  loading,
  error,
}: SelectOrCreateProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  // dropdown position computed from trigger button
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === selectedId);

  // Compute fixed position from trigger element
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Keep dropdown aligned on scroll / resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(document.getElementById("selectorcreate-portal")?.contains(target))
      ) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (creating) setTimeout(() => newInputRef.current?.focus(), 50);
  }, [creating]);

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError("Name is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await onCreate(newName.trim());
      setNewName("");
      setCreating(false);
      setOpen(false);
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Failed to create.",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  const dropdown = (
    <div
      id="selectorcreate-portal"
      style={dropdownStyle}
      className="rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
    >
      {/* Items list */}
      <ul className="max-h-48 overflow-y-auto py-1">
        {items.length === 0 && (
          <li className="px-3.5 py-2.5 text-sm text-gray-400 italic">
            No items yet
          </li>
        )}
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()} // prevent blur before onClick
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
                setCreating(false);
              }}
              className={[
                "flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors",
                item.id === selectedId
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-800 hover:bg-gray-50",
              ].join(" ")}
            >
              {item.name}
              {item.id === selectedId && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Create new section */}
      <div className="border-t border-gray-100">
        {creating ? (
          <div className="flex items-start gap-2 p-2">
            <div className="flex-1 flex flex-col gap-1">
              <input
                ref={newInputRef}
                type="text"
                placeholder={`${createLabel} name…`}
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setCreateError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                  if (e.key === "Escape") setCreating(false);
                }}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              {createError && (
                <p className="text-xs text-red-500">{createError}</p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              loading={createLoading}
              onClick={handleCreate}
            >
              Add
            </Button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
                setCreateError(null);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {createLabel}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={loading}
        onClick={() => setOpen((p) => !p)}
        className={[
          "flex w-full items-center justify-between rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-150",
          "focus-visible:ring-2 focus-visible:ring-indigo-500",
          error ? "border-red-400" : "border-gray-300",
          open ? "border-indigo-500 ring-2 ring-indigo-200" : "",
          loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-gray-400",
        ].join(" ")}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Dropdown rendered in a portal to escape overflow-hidden / overflow-y-auto */}
      {open && typeof document !== "undefined" &&
        createPortal(dropdown, document.body)}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function CreateExpenseModal({
  open,
  onClose,
  onCreated,
  defaultListId,
}: Props) {
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [selectedListId, setSelectedListId] = useState<number | null>(
    defaultListId ?? null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(TODAY);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const reset = useCallback(() => {
    setSelectedListId(defaultListId ?? null);
    setSelectedCategoryId(null);
    setAmount("");
    setCurrency("INR");
    setDescription("");
    setExpenseDate(TODAY);
    setFieldErrors({});
    setServerError(null);
  }, [defaultListId]);

  // Fetch lists & categories when modal opens
  useEffect(() => {
    if (!open) return;
    reset();
    setDataLoading(true);

    Promise.all([listService.getUserList(), categoryService.getCategories()])
      .then(([listsRes, catsRes]) => {
        setUserLists(listsRes.data ?? []);
        setCategories(catsRes.data ?? []);
      })
      .catch(() => {
        setServerError("Failed to load data. Please close and try again.");
      })
      .finally(() => setDataLoading(false));
  }, [open, reset]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitLoading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, submitLoading]);

  async function handleCreateCategory(name: string) {
    const res = await categoryService.createCategory({ name });
    setCategories((prev) => [...prev, res.data]);
    setSelectedCategoryId(res.data.id);
  }

  async function handleCreateList(name: string) {
    const res = await listService.createUserList({ name });
    const newList: UserList = {
      id: 0,
      name: res.data.name,
      description: res.data.description,
    };
    // Re-fetch to get proper id
    const updated = await listService.getUserList();
    setUserLists(updated.data ?? []);
    const created = (updated.data ?? []).find((l) => l.name === res.data.name);
    if (created) {
      setSelectedListId(created.id);
    }
    void newList; // suppress unused warning
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!selectedListId) errors.list = "Please select or create a list.";
    if (!selectedCategoryId) errors.category = "Please select or create a category.";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errors.amount = "Enter a valid amount greater than 0.";
    if (!expenseDate) errors.expenseDate = "Please pick a date.";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitLoading(true);
    setServerError(null);

    try {
      const res = await expenseService.createExpense({
        user_list_id: selectedListId!,
        category_id: selectedCategoryId!,
        amount: parseFloat(amount),
        currency,
        description: description.trim(),
        expense_date: expenseDate,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-expense-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="create-expense-title"
            className="text-base font-semibold text-gray-900"
          >
            Add Expense
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitLoading}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5 px-6 py-5 max-h-[80vh] overflow-y-auto"
        >
          {serverError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {dataLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-400">
              Loading…
            </div>
          ) : (
            <>
              {/* List selector */}
              <SelectOrCreate
                label="List"
                placeholder="Select or create a list"
                items={userLists}
                selectedId={selectedListId}
                onSelect={setSelectedListId}
                onCreate={handleCreateList}
                createLabel="Create new list"
                loading={submitLoading}
                error={fieldErrors.list}
              />

              {/* Category selector */}
              <SelectOrCreate
                label="Category"
                placeholder="Select or create a category"
                items={categories}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                onCreate={handleCreateCategory}
                createLabel="Create new category"
                loading={submitLoading}
                error={fieldErrors.category}
              />

              {/* Amount + Currency */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    label="Amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setFieldErrors((p) => ({ ...p, amount: "" }));
                    }}
                    error={fieldErrors.amount}
                    disabled={submitLoading}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-28">
                  <label className="text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={submitLoading}
                    className="h-[42px] rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expense date */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="expense_date"
                  className="text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <input
                  id="expense_date"
                  type="date"
                  value={expenseDate}
                  max={TODAY}
                  onChange={(e) => {
                    setExpenseDate(e.target.value);
                    setFieldErrors((p) => ({ ...p, expenseDate: "" }));
                  }}
                  disabled={submitLoading}
                  className={[
                    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150",
                    "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500",
                    fieldErrors.expenseDate ? "border-red-400" : "border-gray-300",
                  ].join(" ")}
                />
                {fieldErrors.expenseDate && (
                  <p className="text-xs text-red-500">{fieldErrors.expenseDate}</p>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="expense_desc"
                  className="text-sm font-medium text-gray-700"
                >
                  Description{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="expense_desc"
                  rows={2}
                  placeholder="What was this expense for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitLoading}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitLoading}
              disabled={dataLoading}
              size="md"
            >
              Add Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
