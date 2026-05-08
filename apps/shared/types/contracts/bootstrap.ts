import type { CategoryContract } from './categories';
import type { UserContract } from './auth';
import type { ItemContract } from './items';
import type { ItemToCategoryContract } from './item-category-links';
import type { OutfitContract } from './outfits';

export type BootstrapResponse = {
  user: UserContract | null;
  categories: CategoryContract[];
  items: ItemContract[];
  outfits: OutfitContract[];
  itemCategoryLinks: ItemToCategoryContract[];
};
