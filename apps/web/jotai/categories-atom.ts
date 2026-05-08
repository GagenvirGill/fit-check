import { atom } from "jotai";
import type {
	CategoryContract,
	CategoryCreateResponse,
	CategoryUpdateResponse,
	UpdateCategoryRequest,
} from "@fit-check/shared/types/contracts/categories";
import { apiFetchJson, apiFetchVoid } from "@/lib/api-fetch";
import {
	categoryIdsForItemQueryAtom,
	itemCategoryLinksAtom,
	itemIdsForCategoryQueryAtom,
	type ItemCategoryLink,
} from "@/jotai/item-category-links-atom";

export const categoriesAtom = atom<CategoryContract[]>([]);

const sortCategoriesByNameAsc = (categories: CategoryContract[]): CategoryContract[] =>
	[...categories].sort((a, b) => a.name.localeCompare(b.name));

const appendCategory = (categories: CategoryContract[], category: CategoryContract): CategoryContract[] => [
	...categories,
	category,
];
const removeCategoryById = (categories: CategoryContract[], categoryId: string): CategoryContract[] =>
	categories.filter((category) => category.categoryId !== categoryId);

const replaceCategoryLinks = (
	links: ItemCategoryLink[],
	categoryId: string,
	itemIds: string[]
): ItemCategoryLink[] => {
	const uniqueItemIds = [...new Set(itemIds)];
	const kept = links.filter((link) => link.categoryId !== categoryId);
	const nextLinks = uniqueItemIds.map((itemId) => ({ itemId, categoryId }));
	return [...kept, ...nextLinks];
};

const mergeUpdatedCategory = (
	categories: CategoryContract[],
	updated: CategoryUpdateResponse
): CategoryContract[] =>
	categories.map((category) =>
		category.categoryId === updated.categoryId
			? {
				...category,
				name: updated.name,
				favoriteItem: updated.favoriteItem,
			}
			: category
	);

export const createCategoryAtom = atom(null, async (_get, set, name: string): Promise<CategoryContract> => {
	const created = await apiFetchJson<CategoryCreateResponse>("/categories", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	const nextCategory: CategoryContract = created;
	set(categoriesAtom, (prev) => appendCategory(prev, nextCategory));
	return nextCategory;
});

export const deleteCategoryAtom = atom(null, async (_get, set, categoryId: string): Promise<void> => {
	await apiFetchVoid(`/categories/${categoryId}`, { method: "DELETE" });
	set(categoriesAtom, (prev) => removeCategoryById(prev, categoryId));
	set(itemCategoryLinksAtom, (prev) => prev.filter((link) => link.categoryId !== categoryId));
});

export const replaceCategoryItemsAtom = atom(
	null,
	async (_get, set, payload: { categoryId: string; itemIds: string[] }): Promise<void> => {
		const uniqueItemIds = [...new Set(payload.itemIds)];
		const request: UpdateCategoryRequest = { itemIds: uniqueItemIds };
		const updated = await apiFetchJson<CategoryUpdateResponse>(`/categories/${payload.categoryId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(request),
		});
		set(categoriesAtom, (prev) => mergeUpdatedCategory(prev, updated));
		set(itemCategoryLinksAtom, (prev) =>
			replaceCategoryLinks(prev, payload.categoryId, uniqueItemIds)
		);
	}
);

export const addCategoryToItemsAtom = atom(
	null,
	async (get, set, payload: { categoryId: string; itemIds: string[] }): Promise<void> => {
		const existingItemIds = get(itemIdsForCategoryQueryAtom)(payload.categoryId);
		const nextItemIds = [...new Set([...existingItemIds, ...payload.itemIds])];
		const request: UpdateCategoryRequest = { itemIds: nextItemIds };
		const updated = await apiFetchJson<CategoryUpdateResponse>(`/categories/${payload.categoryId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(request),
		});
		set(categoriesAtom, (prev) => mergeUpdatedCategory(prev, updated));
		set(itemCategoryLinksAtom, (prev) =>
			replaceCategoryLinks(prev, payload.categoryId, nextItemIds)
		);
	}
);

export const removeCategoryFromItemsAtom = atom(
	null,
	async (get, set, payload: { categoryId: string; itemIds: string[] }): Promise<void> => {
		const itemIdsToRemove = new Set(payload.itemIds);
		const existingItemIds = get(itemIdsForCategoryQueryAtom)(payload.categoryId);
		const nextItemIds = existingItemIds.filter((itemId) => !itemIdsToRemove.has(itemId));
		const request: UpdateCategoryRequest = { itemIds: nextItemIds };
		const updated = await apiFetchJson<CategoryUpdateResponse>(`/categories/${payload.categoryId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(request),
		});
		set(categoriesAtom, (prev) => mergeUpdatedCategory(prev, updated));
		set(itemCategoryLinksAtom, (prev) =>
			replaceCategoryLinks(prev, payload.categoryId, nextItemIds)
		);
	}
);

export const setCategoryFavoriteItemAtom = atom(
	null,
	async (_get, set, payload: { categoryId: string; favoriteItem: string | null }): Promise<void> => {
		const request: UpdateCategoryRequest = { favoriteItem: payload.favoriteItem };
		const updated = await apiFetchJson<CategoryUpdateResponse>(`/categories/${payload.categoryId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(request),
		});
		set(categoriesAtom, (prev) => mergeUpdatedCategory(prev, updated));
	}
);

export const clearFavoriteItemReferenceAtom = atom(
	null,
	(_get, set, itemId: string): void => {
		set(categoriesAtom, (prev) =>
			prev.map((category) =>
				category.favoriteItem === itemId
					? { ...category, favoriteItem: null }
					: category
			)
		);
	}
);

export const categoriesSortedByNameAscAtom = atom((get) =>
	sortCategoriesByNameAsc(get(categoriesAtom))
);

export const categoriesForItemQueryAtom = atom((get) => {
	const categories = get(categoriesSortedByNameAscAtom);
	const getCategoryIdsForItem = get(categoryIdsForItemQueryAtom);
	return (itemId: string): CategoryContract[] => {
		const categoryIds = new Set(getCategoryIdsForItem(itemId));
		return categories.filter((category) => categoryIds.has(category.categoryId));
	};
});

// Compatibility alias during rename rollout.
export const categoriesForItemSelectorAtom = categoriesForItemQueryAtom;
