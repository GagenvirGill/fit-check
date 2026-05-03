import * as userSchema from './tables/user';
import * as itemSchema from './tables/item';
import * as categorySchema from './tables/category';
import * as outfitSchema from './tables/outfit';
import * as itemToCategorySchema from './tables/item-to-category';

export type User = typeof userSchema.user.$inferSelect;
export type NewUser = typeof userSchema.user.$inferInsert;

export type Item = typeof itemSchema.item.$inferSelect;
export type NewItem = typeof itemSchema.item.$inferInsert;

export type Category = typeof categorySchema.category.$inferSelect;
export type NewCategory = typeof categorySchema.category.$inferInsert;

export type Outfit = typeof outfitSchema.outfit.$inferSelect;
export type NewOutfit = typeof outfitSchema.outfit.$inferInsert;

export type ItemToCategory = typeof itemToCategorySchema.itemToCategory.$inferSelect;
export type NewItemToCategory = typeof itemToCategorySchema.itemToCategory.$inferInsert;
