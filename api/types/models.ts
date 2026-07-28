export type AuthUser = {
  userId: string;
  email: string;
  provider: string;
};

export type CategoryResponse = {
  categoryId: string;
  name: string;
  favoriteItem: string | null;
};

export type ItemResponse = {
  itemId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
};

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
