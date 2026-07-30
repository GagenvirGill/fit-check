export type ItemResponse = {
  itemId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
};

export type UpdateItemRequest = {
  categoryIds?: string[];
};
