import * as userSchema from './tables/user';
import * as itemSchema from './tables/item';
import * as categorySchema from './tables/category';
import * as outfitSchema from './tables/outfit';
import * as itemToCategorySchema from './tables/item-to-category';
import type { OutfitLayout, OutfitLayoutItem } from './tables/outfit';

export type User = typeof userSchema.user.$inferSelect;
export type Item = typeof itemSchema.item.$inferSelect;
export type Category = typeof categorySchema.category.$inferSelect;
export type Outfit = typeof outfitSchema.outfit.$inferSelect;
export type ItemToCategory = typeof itemToCategorySchema.itemToCategory.$inferSelect;
export type { OutfitLayout, OutfitLayoutItem };
