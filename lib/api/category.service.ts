import { apiClient } from "./client";
import type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  GetCategoriesResponse,
} from "@/types/category";

const CATEGORY = "/category";

export const categoryService = {
  /**
   * Create a new category.
   * POST /category/create
   */
  createCategory: (payload: CreateCategoryRequest) =>
    apiClient.post<CreateCategoryResponse>(`${CATEGORY}/create`, payload),

  /**
   * Get all user categories.
   * GET /category/list
   */
  getCategories: () =>
    apiClient.get<GetCategoriesResponse>(`${CATEGORY}/list`),
};
