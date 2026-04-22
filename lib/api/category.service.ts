import { apiClient } from "./client";
import type {
  Category,
  CategoryRaw,
  CreateCategoryRequest,
  CreateCategoryResponse,
  GetCategoriesResponse,
} from "@/types/category";

const CATEGORY = "/category";

/** Normalize Go-capitalized fields to camelCase for the UI */
function normalizeCategory(raw: CategoryRaw): Category {
  return { id: raw.ID, name: raw.Name };
}

export const categoryService = {
  /**
   * Create a new category.
   * POST /category/create
   */
  createCategory: async (
    payload: CreateCategoryRequest
  ): Promise<{ data: Category }> => {
    const res = await apiClient.post<CreateCategoryResponse>(
      `${CATEGORY}/create`,
      payload
    );
    return { ...res, data: normalizeCategory(res.data) };
  },

  /**
   * Get all user categories.
   * GET /category/list
   */
  getCategories: async (): Promise<{ data: Category[] }> => {
    const res = await apiClient.get<GetCategoriesResponse>(`${CATEGORY}/list`);
    return { ...res, data: (res.data ?? []).map(normalizeCategory) };
  },
};
