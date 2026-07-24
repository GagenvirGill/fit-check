import type { dbSchema, OutfitLayout, OutfitLayoutItem } from "./schema";

export type User = typeof dbSchema.user.$inferSelect;
export type NewUser = typeof dbSchema.user.$inferInsert;

export type Item = typeof dbSchema.item.$inferSelect;
export type NewItem = typeof dbSchema.item.$inferInsert;

export type Category = typeof dbSchema.category.$inferSelect;
export type NewCategory = typeof dbSchema.category.$inferInsert;

export type Outfit = typeof dbSchema.outfit.$inferSelect;
export type NewOutfit = typeof dbSchema.outfit.$inferInsert;

export type ItemToCategory = typeof dbSchema.itemToCategory.$inferSelect;
export type NewItemToCategory = typeof dbSchema.itemToCategory.$inferInsert;

export type { OutfitLayout, OutfitLayoutItem };
