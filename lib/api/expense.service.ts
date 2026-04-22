import { apiClient } from "./client";
import type { CreateExpenseRequest, CreateExpenseResponse } from "@/types/expense";

const EXPENSE = "/expense";

export const expenseService = {
  /**
   * Create a new expense.
   * POST /expense
   */
  createExpense: (payload: CreateExpenseRequest) =>
    apiClient.post<CreateExpenseResponse>(EXPENSE, payload),
};
