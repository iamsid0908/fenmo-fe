import type { ApiResponse } from "./auth";

// ── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export type CreateCategoryResponse = ApiResponse<Category>;
export type GetCategoriesResponse = ApiResponse<Category[]>;
