import { atom } from "jotai";
import type {
	CreateOutfitRequest,
	CreateOutfitResponse,
	OutfitResponse,
} from "@packages/contracts/outfit";
import { apiFetchJson, apiFetchVoid } from "@/lib/api-fetch";

type DraftOutfitItem = {
	itemId: string;
	itemWeight: number;
};

export const outfitsAtom = atom<OutfitResponse[]>([]);

const sortOutfitsByDateWornDesc = (outfits: OutfitResponse[]): OutfitResponse[] =>
	[...outfits].sort((a, b) => b.dateWorn.localeCompare(a.dateWorn));

const appendOutfit = (outfits: OutfitResponse[], outfit: OutfitResponse): OutfitResponse[] => [...outfits, outfit];
const removeOutfitById = (outfits: OutfitResponse[], outfitId: string): OutfitResponse[] =>
	outfits.filter((outfit) => outfit.outfitId !== outfitId);

export const createOutfitAtom = atom(
	null,
	async (
		_get,
		set,
		payload: { dateWorn: string; description: string; items: DraftOutfitItem[][] }
	): Promise<OutfitResponse> => {
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
		const nextOutfit: OutfitResponse = created;
		set(outfitsAtom, (prev) => appendOutfit(prev, nextOutfit));
		return nextOutfit;
	}
);

export const deleteOutfitAtom = atom(null, async (_get, set, outfitId: string): Promise<void> => {
	await apiFetchVoid(`/outfits/${outfitId}`, { method: "DELETE" });
	set(outfitsAtom, (prev) => removeOutfitById(prev, outfitId));
});

export const outfitsSortedByDateWornDescAtom = atom((get) =>
	sortOutfitsByDateWornDesc(get(outfitsAtom))
);

export const filterOutfitsByItemIdsQueryAtom = atom((get) => {
	const outfits = get(outfitsSortedByDateWornDescAtom);
	return (itemIds: string[]): OutfitResponse[] => {
		const itemIdSet = new Set(itemIds);
		return outfits.filter((outfit) =>
			outfit.layout.some((row) =>
				row.some((item) => itemIdSet.has(item.itemId))
			)
		);
	};
});

export const searchOutfitsByDescriptionQueryAtom = atom((get) => {
	const outfits = get(outfitsSortedByDateWornDescAtom);

	return (query: string): OutfitResponse[] => {
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
