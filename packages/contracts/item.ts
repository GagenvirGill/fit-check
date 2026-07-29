export type ItemResponse = {
  itemId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
};

export type CreateItemResponse = ItemResponse;

export type UpdateItemRequest = {
  categoryIds?: string[];
};
