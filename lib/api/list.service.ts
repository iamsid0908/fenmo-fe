import { apiClient } from "./client";
import type {
  CreateUserListRequest,
  CreateUserListResponse,
  GetUserListExpensesQuery,
  GetUserListExpensesResponse,
  GetUserListResponse,
} from "@/types/list";

const USER_LIST = "/user-list";

export const listService = {
  /**
   * Create a new user list.
   * POST /user-list/create
   */
  createUserList: (payload: CreateUserListRequest) =>
    apiClient.post<CreateUserListResponse>(`${USER_LIST}/create`, payload),

  /**
   * Get paginated list summaries with total expenses.
   * GET /user-list/get_expenses?page=1&limit=10
   */
  getUserListExpenses: (query: GetUserListExpensesQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return apiClient.get<GetUserListExpensesResponse>(
      `${USER_LIST}/get_expenses${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * Get all user lists (for selectors).
   * GET /user-list/get
   */
  getUserList: () => apiClient.get<GetUserListResponse>(`${USER_LIST}/get`),
};
