import type { BootstrapResponse } from "@fit-check/shared/types/contracts/bootstrap";
import type { Category } from "@/types/category";
import type { Item } from "@/types/item";

type ItemCategoryLink = BootstrapResponse["itemCategoryLinks"][number];

export const getCategoryIdsForItem = (
	links: ItemCategoryLink[],
	itemId: string
): string[] => {
	return links
		.filter((link) => link.itemId === itemId)
		.map((link) => link.categoryId);
};

export const getItemIdsForCategory = (
	links: ItemCategoryLink[],
	categoryId: string
): string[] => {
	return links
		.filter((link) => link.categoryId === categoryId)
		.map((link) => link.itemId);
};

export const getCategoriesForItem = (
	categories: Category[],
	links: ItemCategoryLink[],
	itemId: string
): Category[] => {
	const categoryIds = new Set(getCategoryIdsForItem(links, itemId));
	return categories.filter((category) => categoryIds.has(category.categoryId));
};

export const getItemsForCategory = (
	items: Item[],
	links: ItemCategoryLink[],
	categoryId: string
): Item[] => {
	const itemIds = new Set(getItemIdsForCategory(links, categoryId));
	return items.filter((item) => itemIds.has(item.itemId));
};

export const filterItemsByCategoryIds = (
	items: Item[],
	links: ItemCategoryLink[],
	categoryIds: string[]
): Item[] => {
	if (categoryIds.length === 0) {
		return items;
	}

	const wanted = new Set(categoryIds);
	const matchingItemIds = new Set<string>();

	for (const link of links) {
		if (wanted.has(link.categoryId)) {
			matchingItemIds.add(link.itemId);
		}
	}

	return items.filter((item) => matchingItemIds.has(item.itemId));
};
