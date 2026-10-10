export type CategoryResponse = {
  categoryId: string;
  name: string;
  favoriteItem: string | null;
};

export type ListCategoriesResponse = CategoryResponse[];

export type CreateCategoryRequest = {
  name: string;
};

export type CreateCategoryResponse = CategoryResponse;

export type UpdateCategoryRequest = {
  name?: string;
  favoriteItem?: string | null;
  itemIds?: string[];
};

export type UpdateCategoryResponse = CategoryResponse;
