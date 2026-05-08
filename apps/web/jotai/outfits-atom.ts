import { atom } from "jotai";
import type {
	CreateOutfitRequest,
	OutfitContract,
	CreateOutfitResponse,
} from "@fit-check/shared/types/contracts/outfits";
import { apiFetchJson, apiFetchVoid } from "@/lib/api-fetch";

type DraftOutfitItem = {
	itemId: string;
	itemWeight: number;
};

export const outfitsAtom = atom<OutfitContract[]>([]);

const sortOutfitsByDateWornAsc = (outfits: OutfitContract[]): OutfitContract[] =>
	[...outfits].sort((a, b) => a.dateWorn.localeCompare(b.dateWorn));

const appendOutfit = (outfits: OutfitContract[], outfit: OutfitContract): OutfitContract[] => [...outfits, outfit];
const removeOutfitById = (outfits: OutfitContract[], outfitId: string): OutfitContract[] =>
	outfits.filter((outfit) => outfit.outfitId !== outfitId);

export const createOutfitAtom = atom(
	null,
	async (
		_get,
		set,
		payload: { dateWorn: string; description: string; items: DraftOutfitItem[][] }
	): Promise<OutfitContract> => {
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
		const nextOutfit: OutfitContract = created;
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
	return (itemIds: string[]): OutfitContract[] => {
		const itemIdSet = new Set(itemIds);
		return outfits.filter((outfit) =>
			outfit.layout.some((row) =>
				row.some((item) => itemIdSet.has(item.itemId))
			)
		);
	};
});

export const searchOutfitsByDescriptionQueryAtom = atom((get) => {
	const outfits = get(outfitsSortedByDateWornAscAtom);

	return (query: string): OutfitContract[] => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return outfits;
		}

		return outfits.filter((outfit) =>
			(outfit.description ?? "").toLowerCase().includes(normalizedQuery)
		);
	};
});

// Compatibility aliases during rename rollout.
export const filterOutfitsByItemIdsSelectorAtom = filterOutfitsByItemIdsQueryAtom;
export const searchOutfitsByDescriptionSelectorAtom = searchOutfitsByDescriptionQueryAtom;
