import type {
	CreateItemResponse,
	UpdateItemRequest,
} from "@fit-check/shared/types/contracts/items";
import { del, patch, post } from "@/api/client";
import { getBootstrapData } from "@/api/actions/bootstrap";
import {
	filterItemsByCategoryIds,
	getCategoriesForItem as getCategoriesForItemFromLinks,
	getCategoryIdsForItem,
} from "@/lib/item-category-links";
import type { Category } from "@/types/category";
import type { Item } from "@/types/item";

export async function getAllItems(): Promise<Item[]> {
	const data = await getBootstrapData();
	return data.items;
}

export async function createItem(formData: FormData): Promise<boolean> {
	await post<CreateItemResponse>("/items", formData);
	return true;
}

export async function deleteItem(itemId: string): Promise<boolean> {
	await del<void>(`/items/${itemId}`);
	return true;
}

export async function getCategoriesForItem(itemId: string): Promise<Category[]> {
	const data = await getBootstrapData();
	return getCategoriesForItemFromLinks(data.categories, data.itemCategoryLinks, itemId);
}

export async function filterItemsByCategories(categories: string[]): Promise<Item[]> {
	const data = await getBootstrapData();
	return filterItemsByCategoryIds(data.items, data.itemCategoryLinks, categories);
}

export async function addItemToCategories(
	itemId: string,
	categories: string[]
): Promise<boolean> {
	const data = await getBootstrapData();
	const existingCategoryIds = getCategoryIdsForItem(data.itemCategoryLinks, itemId);
	const nextCategoryIds = [...new Set([...existingCategoryIds, ...categories])];
	const payload: UpdateItemRequest = { categoryIds: nextCategoryIds };

	await patch<void>(`/items/${itemId}`, payload);
	return true;
}

export async function removeItemFromCategories(
	itemId: string,
	categories: string[]
): Promise<boolean> {
	const data = await getBootstrapData();
	const categoryIdsToRemove = new Set(categories);
	const existingCategoryIds = getCategoryIdsForItem(data.itemCategoryLinks, itemId);
	const nextCategoryIds = existingCategoryIds.filter(
		(categoryId) => !categoryIdsToRemove.has(categoryId)
	);
	const payload: UpdateItemRequest = { categoryIds: nextCategoryIds };

	await patch<void>(`/items/${itemId}`, payload);
	return true;
}

export async function getRandomItemWithCategories(
	categories: string[]
): Promise<Item> {
	const filteredItems = await filterItemsByCategories(categories);
	if (filteredItems.length === 0) {
		throw new Error("No items found for selected categories");
	}

	const randomIndex = Math.floor(Math.random() * filteredItems.length);
	return filteredItems[randomIndex];
}
