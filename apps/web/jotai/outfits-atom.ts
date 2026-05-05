import { atom } from "jotai";
import type {
	CreateOutfitRequest,
	CreateOutfitResponse,
} from "@fit-check/shared/types/contracts/outfits";
import { adaptOutfitRecord } from "@/lib/adapters/bootstrap";
import { apiFetchJson, apiFetchVoid } from "@/lib/api-fetch";
import { itemsAtom } from "@/jotai/items-atom";
import type { Outfit } from "@/types/outfit";

type DraftOutfitItem = {
	itemId: string;
	itemWeight: number;
};

export const outfitsAtom = atom<Outfit[]>([]);

const sortOutfitsByDateWornAsc = (outfits: Outfit[]): Outfit[] =>
	[...outfits].sort((a, b) => a.dateWorn.localeCompare(b.dateWorn));

const appendOutfit = (outfits: Outfit[], outfit: Outfit): Outfit[] => [...outfits, outfit];
const removeOutfitById = (outfits: Outfit[], outfitId: string): Outfit[] =>
	outfits.filter((outfit) => outfit.outfitId !== outfitId);

export const createOutfitAtom = atom(
	null,
	async (
		get,
		set,
		payload: { dateWorn: string; description: string; items: DraftOutfitItem[][] }
	): Promise<Outfit> => {
		const request: CreateOutfitRequest = {
			dateWorn: payload.dateWorn,
			description: payload.description.trim() ? payload.description : null,
			layout: payload.items.map((row) =>
				row.map((item) => ({
					itemId: item.itemId,
					weight: item.itemWeight,
				}))
			),
		};

		const created = await apiFetchJson<CreateOutfitResponse>("/outfits", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(request),
		});
		const itemById = new Map(get(itemsAtom).map((item) => [item.itemId, item]));
		const nextOutfit = adaptOutfitRecord(created, itemById);
		set(outfitsAtom, (prev) => appendOutfit(prev, nextOutfit));
		return nextOutfit;
	}
);

export const deleteOutfitAtom = atom(null, async (_get, set, outfitId: string): Promise<void> => {
	await apiFetchVoid(`/outfits/${outfitId}`, { method: "DELETE" });
	set(outfitsAtom, (prev) => removeOutfitById(prev, outfitId));
});

export const outfitsSortedByDateWornAscAtom = atom((get) =>
	sortOutfitsByDateWornAsc(get(outfitsAtom))
);

export const filterOutfitsByItemIdsQueryAtom = atom((get) => {
	const outfits = get(outfitsSortedByDateWornAscAtom);
	return (itemIds: string[]): Outfit[] => {
		const itemIdSet = new Set(itemIds);
		return outfits.filter((outfit) =>
			outfit.OutfitTemplate.TemplateRows.some((row) =>
				row.TemplateItems.some((item) => itemIdSet.has(item.Item.itemId))
			)
		);
	};
});

export const searchOutfitsByDescriptionQueryAtom = atom((get) => {
	const outfits = get(outfitsSortedByDateWornAscAtom);

	return (query: string): Outfit[] => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return outfits;
		}

		return outfits.filter((outfit) =>
			outfit.description.toLowerCase().includes(normalizedQuery)
		);
	};
});

// Compatibility aliases during rename rollout.
export const filterOutfitsByItemIdsSelectorAtom = filterOutfitsByItemIdsQueryAtom;
export const searchOutfitsByDescriptionSelectorAtom = searchOutfitsByDescriptionQueryAtom;
