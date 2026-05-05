import type { Category, Item, Outfit, User } from '../models';

export type BootstrapResponse = {
  user: Pick<User, 'userId' | 'email' | 'provider'> | null;
  categories: Array<Pick<Category, 'categoryId' | 'name' | 'favoriteItem'>>;
  items: Array<Pick<Item, 'itemId' | 'imagePath' | 'imageWidth' | 'imageHeight'>>;
  outfits: Array<Pick<Outfit, 'outfitId' | 'dateWorn' | 'description' | 'layout'>>;
};
