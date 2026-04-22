import type { ApiResponse } from "./auth";

// ── Category ─────────────────────────────────────────────────────────────────

/** Raw shape returned by the API (Go capitalized fields) */
export interface CategoryRaw {
  ID: number;
  UserId: number;
  Name: string;
  CreatedAt: string;
  UpdatedAt: string;
}

/** Normalized shape used throughout the UI */
export interface Category {
  id: number;
  name: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export type CreateCategoryResponse = ApiResponse<CategoryRaw>;
export type GetCategoriesResponse = ApiResponse<CategoryRaw[]>;
