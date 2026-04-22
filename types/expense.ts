import type { ApiResponse } from "./auth";

// ── Expense ───────────────────────────────────────────────────────────────────

export interface CreateExpenseRequest {
  user_list_id: number;
  amount: number;
  category_id: number;
  currency?: string;
  description?: string;
  expense_date: string; // YYYY-MM-DD
}

export interface ExpenseData {
  id: number;
  user_list_id: number;
  amount: number;
  category_id: number;
  currency: string;
  description: string;
  expense_date: string;
  created_at: string;
}

export type CreateExpenseResponse = ApiResponse<ExpenseData>;

// ── Recent expense list ───────────────────────────────────────────────────────

export interface RecentExpenseItem {
  id: number;
  amount: number;
  currency: string;
  category_id: number;
  category: string;
  user_list_id: number;
  user_list: string;
  description: string;
  date: string;
  created_at: string;
}

export interface MetaPagination {
  page_number: number;
  page_size: number;
  total_pages: number;
  total_records: number;
}

export interface RecentExpensesResponse {
  message: string;
  data: RecentExpenseItem[];
  meta: MetaPagination;
}

export interface ListExpenseQuery {
  category_id?: number;
  user_list_id?: number;
  page?: number;
  limit?: number;
}
