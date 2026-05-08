/**
 * PURE TYPES RE-EXPORT STRATEGY
 * This file re-exports database types as type-only imports.
 * This allows consumers to stay type-only and avoid pulling runtime DB code.
 */

import type {
  Category as CategoryModel,
  Item as ItemModel,
  ItemToCategory as ItemToCategoryModel,
  Outfit as OutfitModel,
  OutfitLayout as OutfitLayoutModel,
  OutfitLayoutItem as OutfitLayoutItemModel,
  User as UserModel,
} from "@fit-check/database/types";

export type {
  UserModel,
  ItemModel,
  CategoryModel,
  OutfitModel,
  ItemToCategoryModel,
  OutfitLayoutModel,
  OutfitLayoutItemModel,
};
