/**
 * PURE TYPES RE-EXPORT STRATEGY
 * This file re-exports database types as type-only imports.
 * This allows consumers to stay type-only and avoid pulling runtime DB code.
 */

import type {
  Category,
  Item,
  ItemToCategory,
  Outfit,
  OutfitLayout,
  OutfitLayoutItem,
  User,
} from "@fit-check/database/types";

export type {
  User,
  Item,
  Category,
  Outfit,
  ItemToCategory,
  OutfitLayout,
  OutfitLayoutItem,
};
