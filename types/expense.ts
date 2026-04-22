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
