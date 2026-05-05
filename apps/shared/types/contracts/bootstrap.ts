import type { Category, Item, ItemToCategory, Outfit, User } from '../models';

export type BootstrapResponse = {
  user: Pick<User, 'userId' | 'email' | 'provider'> | null;
  categories: Array<Pick<Category, 'categoryId' | 'name' | 'favoriteItem'>>;
  items: Array<Pick<Item, 'itemId' | 'imagePath' | 'imageWidth' | 'imageHeight'>>;
  outfits: Array<Pick<Outfit, 'outfitId' | 'dateWorn' | 'description' | 'layout'>>;
  itemCategoryLinks: Pick<ItemToCategory, 'itemId' | 'categoryId'>;
};
