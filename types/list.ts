// ── Request types ────────────────────────────────────────────────────────────

export interface CreateUserListRequest {
  name: string;
  description?: string;
}

export interface GetUserListExpensesQuery {
  page?: number;
  limit?: number;
}

// ── Response types ───────────────────────────────────────────────────────────

export interface CreateUserListData {
  name: string;
  description: string;
  user_id: number;
  created_at: string;
}

export interface UserListExpenseSummary {
  id: number;
  name: string;
  description: string;
  total_expense: number;
}

import type { ApiResponse } from "./auth";

export type CreateUserListResponse = ApiResponse<CreateUserListData>;
export type GetUserListExpensesResponse = ApiResponse<UserListExpenseSummary[]>;

// Simple list (for selectors)
export interface UserList {
  id: number;
  name: string;
  description: string;
}
export type GetUserListResponse = ApiResponse<UserList[]>;
