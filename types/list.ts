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

/** Raw shape from GET /user-list/get — Go may return capitalized or lowercase fields */
export interface UserListRaw {
  // capitalized (Go struct default)
  ID?: number;
  Name?: string;
  Description?: string;
  // lowercase alternatives
  id?: number;
  name?: string;
  description?: string;
  UserId?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export type GetUserListResponse = ApiResponse<UserListRaw[]>;
