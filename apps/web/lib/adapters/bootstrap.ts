import type { BootstrapResponse } from "@fit-check/shared/types/contracts/bootstrap";
import type { CreateItemResponse } from "@fit-check/shared/types/contracts/items";
import type { CreateOutfitResponse } from "@fit-check/shared/types/contracts/outfits";
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

type ItemRecord = BootstrapResponse["items"][number] | CreateItemResponse;
type OutfitRecord = BootstrapResponse["outfits"][number] | CreateOutfitResponse;

const toIsoString = (value: Date | string): string => {
	return new Date(value).toISOString();
};

const createMissingItem = (itemId: string): Item => ({
	itemId,
	imagePath: "/default_icon.png",
	imageWidth: 1,
	imageHeight: 1,
	createdAt: new Date(0).toISOString(),
});

const toTemplateRows = (
	outfitId: string,
	layout: OutfitRecord["layout"],
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

export const adaptItemRecord = (item: ItemRecord): Item => ({
	itemId: item.itemId,
	imagePath: item.imagePath,
	imageWidth: item.imageWidth,
	imageHeight: item.imageHeight,
	createdAt: toIsoString(item.createdAt),
});

export const adaptCategoryRecord = (category: BootstrapResponse["categories"][number]): Category => ({
	categoryId: category.categoryId,
	name: category.name,
	favoriteItem: category.favoriteItem,
});

export const adaptOutfitRecord = (outfit: OutfitRecord, itemById: Map<string, Item>): Outfit => {
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
};

export const adaptBootstrapResponse = (response: BootstrapResponse): BootstrapViewModel => {
	const items: Item[] = response.items.map(adaptItemRecord);
	const categories: Category[] = response.categories.map(adaptCategoryRecord);

	const itemById = new Map(items.map((item) => [item.itemId, item]));
	const outfits: Outfit[] = response.outfits.map((outfit) => adaptOutfitRecord(outfit, itemById));

	return {
		user: response.user,
		categories,
		items,
		outfits,
		itemCategoryLinks: response.itemCategoryLinks,
	};
};
