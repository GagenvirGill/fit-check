import type * as userSchema from './tables/user';
import type * as itemSchema from './tables/item';
import type * as categorySchema from './tables/category';
import type * as outfitSchema from './tables/outfit';
import type * as itemToCategorySchema from './tables/item-to-category';
import type { OutfitLayout, OutfitLayoutItem } from './tables/outfit';

export type User = typeof userSchema.user.$inferSelect;
export type Item = typeof itemSchema.item.$inferSelect;
export type Category = typeof categorySchema.category.$inferSelect;
export type Outfit = typeof outfitSchema.outfit.$inferSelect;
export type ItemToCategory = typeof itemToCategorySchema.itemToCategory.$inferSelect;
export type { OutfitLayout, OutfitLayoutItem };
