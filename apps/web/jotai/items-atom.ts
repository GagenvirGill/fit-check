import { atom } from "jotai";
import type {
	CreateItemResponse,
	ItemContract,
	UpdateItemRequest,
} from "@fit-check/shared/types/contracts/items";
import { apiFetchJson, apiFetchVoid } from "@/lib/api-fetch";
import {
	categoryIdsForItemQueryAtom,
	itemCategoryLinksAtom,
	itemIdsByCategoryIdsQueryAtom,
	itemIdsForCategoryQueryAtom,
} from "@/jotai/item-category-links-atom";
import {
	clearFavoriteItemReferenceAtom,
} from "@/jotai/categories-atom";
import { buildImageUrl } from "@/lib/image-url";
type ItemCategoryLink = Array<{ itemId: string; categoryId: string }>;

export const itemsAtom = atom<ItemContract[]>([]);

const sortItemsByCreatedAtAsc = (items: ItemContract[]): ItemContract[] =>
	[...items].sort((a, b) => {
		const aTime = new Date(a.createdAt).getTime();
		const bTime = new Date(b.createdAt).getTime();
		return aTime - bTime;
	});

const appendItem = (items: ItemContract[], item: ItemContract): ItemContract[] => [...items, item];
const removeItemById = (items: ItemContract[], itemId: string): ItemContract[] =>
	items.filter((item) => item.itemId !== itemId);

const replaceItemLinks = (
	links: ItemCategoryLink,
	itemId: string,
	categoryIds: string[]
): ItemCategoryLink => {
	const uniqueCategoryIds = [...new Set(categoryIds)];
	const kept = links.filter((link) => link.itemId !== itemId);
	const nextLinks = uniqueCategoryIds.map((categoryId) => ({ itemId, categoryId }));
	return [...kept, ...nextLinks];
};

const requestItemJson = async <TResponse>(
	method: "POST" | "PATCH",
	path: string,
	body: FormData | object
): Promise<TResponse> => {
	if (body instanceof FormData) {
		return apiFetchJson<TResponse>(path, { method, body });
	}

	return apiFetchJson<TResponse>(path, {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
};

const requestItemVoid = async (
	method: "DELETE" | "PATCH",
	path: string,
	body?: object
): Promise<void> => {
	if (body === undefined) {
		return apiFetchVoid(path, { method });
	}

	return apiFetchVoid(path, {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
};

export const createItemAtom = atom(
	null,
	async (_get, set, formData: FormData): Promise<ItemContract> => {
		const created = await requestItemJson<CreateItemResponse>("POST", "/items", formData);
		const nextItem: ItemContract = {
			...created,
			imagePath: buildImageUrl(created.imagePath),
			createdAt: new Date(created.createdAt),
		};
		set(itemsAtom, (prev) => appendItem(prev, nextItem));
		return nextItem;
	}
);

export const deleteItemAtom = atom(null, async (_get, set, itemId: string): Promise<void> => {
	await requestItemVoid("DELETE", `/items/${itemId}`);
	set(itemsAtom, (prev) => removeItemById(prev, itemId));
	set(itemCategoryLinksAtom, (prev) => prev.filter((link) => link.itemId !== itemId));
	set(clearFavoriteItemReferenceAtom, itemId);
});

export const replaceItemCategoriesAtom = atom(
	null,
	async (_get, set, payload: { itemId: string; categoryIds: string[] }): Promise<void> => {
		const uniqueCategoryIds = [...new Set(payload.categoryIds)];
		const request: UpdateItemRequest = { categoryIds: uniqueCategoryIds };
		await requestItemVoid("PATCH", `/items/${payload.itemId}`, request);
		set(itemCategoryLinksAtom, (prev) =>
			replaceItemLinks(prev, payload.itemId, uniqueCategoryIds)
		);
	}
);

export const addItemToCategoriesAtom = atom(
	null,
	async (get, set, payload: { itemId: string; categoryIds: string[] }): Promise<void> => {
		const existingCategoryIds = get(categoryIdsForItemQueryAtom)(payload.itemId);
		const nextCategoryIds = [...new Set([...existingCategoryIds, ...payload.categoryIds])];
		const request: UpdateItemRequest = { categoryIds: nextCategoryIds };
		await requestItemVoid("PATCH", `/items/${payload.itemId}`, request);
		set(itemCategoryLinksAtom, (prev) =>
			replaceItemLinks(prev, payload.itemId, nextCategoryIds)
		);
	}
);

export const removeItemFromCategoriesAtom = atom(
	null,
	async (get, set, payload: { itemId: string; categoryIds: string[] }): Promise<void> => {
		const categoryIdsToRemove = new Set(payload.categoryIds);
		const existingCategoryIds = get(categoryIdsForItemQueryAtom)(payload.itemId);
		const nextCategoryIds = existingCategoryIds.filter(
			(categoryId) => !categoryIdsToRemove.has(categoryId)
		);
		const request: UpdateItemRequest = { categoryIds: nextCategoryIds };
		await requestItemVoid("PATCH", `/items/${payload.itemId}`, request);
		set(itemCategoryLinksAtom, (prev) =>
			replaceItemLinks(prev, payload.itemId, nextCategoryIds)
		);
	}
);

export const itemsSortedByCreatedAtAscAtom = atom((get) =>
	sortItemsByCreatedAtAsc(get(itemsAtom))
);

export const itemsForCategoryQueryAtom = atom((get) => {
	const items = get(itemsSortedByCreatedAtAscAtom);
	const getItemIdsForCategory = get(itemIdsForCategoryQueryAtom);

	return (categoryId: string): ItemContract[] => {
		const itemIds = new Set(getItemIdsForCategory(categoryId));
		return items.filter((item) => itemIds.has(item.itemId));
	};
});

export const itemsByCategoryIdsQueryAtom = atom((get) => {
	const items = get(itemsSortedByCreatedAtAscAtom);
	const getItemIdsByCategoryIds = get(itemIdsByCategoryIdsQueryAtom);

	return (categoryIds: string[]): ItemContract[] => {
		if (categoryIds.length === 0) {
			return items;
		}
		const itemIds = new Set(getItemIdsByCategoryIds(categoryIds));
		return items.filter((item) => itemIds.has(item.itemId));
	};
});

export const randomItemForCategoryIdsQueryAtom = atom((get) => {
	const items = get(itemsSortedByCreatedAtAscAtom);
	const getItemIdsByCategoryIds = get(itemIdsByCategoryIdsQueryAtom);

	return (categoryIds: string[]): ItemContract | null => {
		const itemIds =
			categoryIds.length > 0
				? new Set(getItemIdsByCategoryIds(categoryIds))
				: null;
		const filteredItems =
			itemIds ? items.filter((item) => itemIds.has(item.itemId)) : items;

		if (filteredItems.length === 0) {
			return null;
		}

		const randomIndex = Math.floor(Math.random() * filteredItems.length);
		return filteredItems[randomIndex];
	};
});

// Compatibility aliases during rename rollout.
export const itemsForCategorySelectorAtom = itemsForCategoryQueryAtom;
export const itemsByCategoryIdsSelectorAtom = itemsByCategoryIdsQueryAtom;
export const randomItemForCategoryIdsSelectorAtom = randomItemForCategoryIdsQueryAtom;
