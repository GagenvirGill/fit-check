import { atom } from "jotai";
import type { BootstrapResponse } from "@fit-check/shared/types/contracts/bootstrap";

export type ItemCategoryLink = BootstrapResponse["itemCategoryLinks"][number];

export const itemCategoryLinksAtom = atom<ItemCategoryLink[]>([]);

export const itemToCategoryMapAtom = atom((get) => {
	const map = new Map<string, Set<string>>();
	for (const link of get(itemCategoryLinksAtom)) {
		const existing = map.get(link.itemId);
		if (existing) {
			existing.add(link.categoryId);
			continue;
		}
		map.set(link.itemId, new Set([link.categoryId]));
	}
	return map;
});

export const categoryToItemMapAtom = atom((get) => {
	const map = new Map<string, Set<string>>();
	for (const link of get(itemCategoryLinksAtom)) {
		const existing = map.get(link.categoryId);
		if (existing) {
			existing.add(link.itemId);
			continue;
		}
		map.set(link.categoryId, new Set([link.itemId]));
	}
	return map;
});

export const categoryIdsForItemQueryAtom = atom((get) => {
	const map = get(itemToCategoryMapAtom);
	return (itemId: string): string[] => [...(map.get(itemId) ?? new Set())];
});

export const itemIdsForCategoryQueryAtom = atom((get) => {
	const map = get(categoryToItemMapAtom);
	return (categoryId: string): string[] => [...(map.get(categoryId) ?? new Set())];
});

export const itemIdsByCategoryIdsQueryAtom = atom((get) => {
	const map = get(categoryToItemMapAtom);
	return (categoryIds: string[]): string[] => {
		if (categoryIds.length === 0) {
			return [];
		}

		const matchingItemIds = new Set<string>();
		for (const categoryId of categoryIds) {
			const itemIds = map.get(categoryId);
			if (!itemIds) {
				continue;
			}
			for (const itemId of itemIds) {
				matchingItemIds.add(itemId);
			}
		}

		return [...matchingItemIds];
	};
});

// Compatibility aliases during rename rollout.
export const categoryIdsForItemSelectorAtom = categoryIdsForItemQueryAtom;
export const itemIdsForCategorySelectorAtom = itemIdsForCategoryQueryAtom;
export const itemIdsByCategoryIdsSelectorAtom = itemIdsByCategoryIdsQueryAtom;
