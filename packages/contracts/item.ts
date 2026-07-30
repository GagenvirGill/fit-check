export type ItemResponse = {
  itemId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
};

export type UpdateItemRequest = {
  categoryIds?: string[];
};
