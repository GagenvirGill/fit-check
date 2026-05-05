import type { BootstrapResponse } from "@fit-check/shared/types/contracts/bootstrap";
import type { Category } from "@/types/category";
import type { Item } from "@/types/item";
import type { Outfit, TemplateItem, TemplateRow } from "@/types/outfit";

export type BootstrapViewModel = {
	user: BootstrapResponse["user"];
	categories: Category[];
	items: Item[];
	outfits: Outfit[];
	itemCategoryLinks: BootstrapResponse["itemCategoryLinks"];
};

const createMissingItem = (itemId: string): Item => ({
	itemId,
	imagePath: "/default_icon.png",
	imageWidth: 1,
	imageHeight: 1,
});

const toTemplateRows = (
	outfitId: string,
	layout: BootstrapResponse["outfits"][number]["layout"],
	itemById: Map<string, Item>
): TemplateRow[] => {
	return layout.map((row, rowIndex) => {
		const templateItems: TemplateItem[] = row.map((layoutItem, itemIndex) => ({
			templateItemId: `${outfitId}-${rowIndex}-${itemIndex}`,
			itemWeight: layoutItem.weight,
			orderNum: itemIndex,
			Item: itemById.get(layoutItem.itemId) ?? createMissingItem(layoutItem.itemId),
		}));

		return {
			orderNum: rowIndex,
			TemplateItems: templateItems,
		};
	});
};

const getTotalWeight = (rows: TemplateRow[]): number => {
	const total = rows.reduce((sum, row) => {
		if (row.TemplateItems.length === 0) {
			return sum;
		}
		const rowMax = Math.max(...row.TemplateItems.map((item) => item.itemWeight));
		return sum + rowMax;
	}, 0);

	return total > 0 ? total : 1;
};

export const adaptBootstrapResponse = (response: BootstrapResponse): BootstrapViewModel => {
	const items: Item[] = response.items.map((item) => ({
		itemId: item.itemId,
		imagePath: item.imagePath,
		imageWidth: item.imageWidth,
		imageHeight: item.imageHeight,
	}));

	const categories: Category[] = response.categories.map((category) => ({
		categoryId: category.categoryId,
		name: category.name,
		favoriteItem: category.favoriteItem,
	}));

	const itemById = new Map(items.map((item) => [item.itemId, item]));

	const outfits: Outfit[] = response.outfits.map((outfit) => {
		const templateRows = toTemplateRows(outfit.outfitId, outfit.layout, itemById);
		return {
			outfitId: outfit.outfitId,
			dateWorn: outfit.dateWorn,
			description: outfit.description ?? "",
			OutfitTemplate: {
				TemplateRows: templateRows,
				totalWeight: getTotalWeight(templateRows),
			},
		};
	});

	return {
		user: response.user,
		categories,
		items,
		outfits,
		itemCategoryLinks: response.itemCategoryLinks,
	};
};
