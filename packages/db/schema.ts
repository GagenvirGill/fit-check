import { category, categoryRelations } from "./schema/tables/category";
import { item, itemRelations } from "./schema/tables/item";
import {
  itemToCategory,
  itemToCategoryRelations,
} from "./schema/tables/item-to-category";
import { outfit, outfitRelations } from "./schema/tables/outfit";
import { user, userRelations } from "./schema/tables/user";

export type { OutfitLayout, OutfitLayoutItem } from "./schema/tables/outfit";

export const dbSchema = {
  user,
  userRelations,
  item,
  itemRelations,
  category,
  categoryRelations,
  outfit,
  outfitRelations,
  itemToCategory,
  itemToCategoryRelations,
};
