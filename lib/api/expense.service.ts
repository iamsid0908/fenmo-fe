import { apiClient } from "./client";
import type {
  CreateExpenseRequest,
  CreateExpenseResponse,
  ListExpenseQuery,
  RecentExpensesResponse,
} from "@/types/expense";

const EXPENSE = "/expense";

export const expenseService = {
  /**
   * Create a new expense.
   * POST /expense
   */
  createExpense: (payload: CreateExpenseRequest) =>
    apiClient.post<CreateExpenseResponse>(EXPENSE, payload),

  /**
   * List recent expenses with optional filters and pagination.
   * GET /expense/list
   */
  recentExpenses: (
    query: ListExpenseQuery = {}
  ): Promise<RecentExpensesResponse> => {
    const params = new URLSearchParams();
    if (query.category_id) params.set("category_id", String(query.category_id));
    if (query.user_list_id)
      params.set("user_list_id", String(query.user_list_id));
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return apiClient.get<RecentExpensesResponse>(
      `${EXPENSE}/list${qs ? `?${qs}` : ""}`
    );
  },
};
