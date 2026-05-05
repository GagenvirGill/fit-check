import type {
	CategoryCreateResponse,
	CategoryUpdateResponse,
	UpdateCategoryRequest,
} from "@fit-check/shared/types/contracts/categories";
import { del, patch, post } from "@/api/client";
import { getBootstrapData } from "@/api/actions/bootstrap";
import { getItemIdsForCategory } from "@/lib/item-category-links";
import type { Category } from "@/types/category";

export async function getAllCategories(): Promise<Category[]> {
	const data = await getBootstrapData();
	return data.categories;
}

export async function createCategory(name: string): Promise<boolean> {
	await post<CategoryCreateResponse>("/categories", { name });
	return true;
}

export async function deleteCategory(categoryId: string): Promise<boolean> {
	await del<void>(`/categories/${categoryId}`);
	return true;
}

export async function addCategoryToItems(
	categoryId: string,
	items: string[]
): Promise<boolean> {
	const data = await getBootstrapData();
	const existingItemIds = getItemIdsForCategory(data.itemCategoryLinks, categoryId);
	const nextItemIds = [...new Set([...existingItemIds, ...items])];
	const payload: UpdateCategoryRequest = { itemIds: nextItemIds };

	await patch<CategoryUpdateResponse>(`/categories/${categoryId}`, payload);
	return true;
}

export async function removeCategoryFromItems(
	categoryId: string,
	items: string[]
): Promise<boolean> {
	const data = await getBootstrapData();
	const itemIdsToRemove = new Set(items);
	const existingItemIds = getItemIdsForCategory(data.itemCategoryLinks, categoryId);
	const nextItemIds = existingItemIds.filter((itemId) => !itemIdsToRemove.has(itemId));
	const payload: UpdateCategoryRequest = { itemIds: nextItemIds };

	await patch<CategoryUpdateResponse>(`/categories/${categoryId}`, payload);
	return true;
}

export async function setCategoriesFavItem(
	categoryId: string,
	itemId: string | null
): Promise<boolean> {
	const payload: UpdateCategoryRequest = { favoriteItem: itemId };
	await patch<CategoryUpdateResponse>(`/categories/${categoryId}`, payload);
	return true;
}
