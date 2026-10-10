export type OutfitLayoutItem = {
  itemId: string;
  weight: number;
};

export type OutfitLayout = OutfitLayoutItem[][];

export type OutfitResponse = {
  outfitId: string;
  dateWorn: string;
  description: string | null;
  layout: OutfitLayout;
};

export type ListOutfitsResponse = OutfitResponse[];

export type CreateOutfitRequest = {
  dateWorn: string;
  description?: string | null;
  layout: OutfitLayout;
};

export type CreateOutfitResponse = OutfitResponse;

export type UpdateOutfitRequest = {
  dateWorn?: string;
  description?: string | null;
  layout?: OutfitLayout;
};

export type UpdateOutfitResponse = OutfitResponse;
