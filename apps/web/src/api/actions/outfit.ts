import type {
	CreateOutfitRequest,
	CreateOutfitResponse,
} from "@fit-check/shared/types/contracts/outfits";
import { del, post } from "@/api/client";
import { getBootstrapData } from "@/api/actions/bootstrap";
import type { Outfit } from "@/types/outfit";

type DraftOutfitItem = {
	itemId: string;
	itemWeight: number;
};

export async function getAllOutfits(): Promise<Outfit[]> {
	const data = await getBootstrapData();
	return data.outfits;
}

export async function createOutfit(
	dateWorn: string,
	description: string,
	items: DraftOutfitItem[][]
): Promise<boolean> {
	const payload: CreateOutfitRequest = {
		dateWorn,
		description: description.trim() ? description : null,
		layout: items.map((row) =>
			row.map((item) => ({
				itemId: item.itemId,
				weight: item.itemWeight,
			}))
		),
	};

	await post<CreateOutfitResponse>("/outfits", payload);
	return true;
}

export async function deleteOutfit(outfitId: string): Promise<boolean> {
	await del<void>(`/outfits/${outfitId}`);
	return true;
}

export async function searchOutfits(query: string): Promise<Outfit[]> {
	const data = await getBootstrapData();
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return data.outfits;
	}

	return data.outfits.filter((outfit) =>
		outfit.description.toLowerCase().includes(normalizedQuery)
	);
}
