/**
 * PURE TYPES RE-EXPORT STRATEGY
 * This file re-exports database types using TypeScript `import()` types.
 * This allows consumers to stay type-only and avoid pulling runtime DB code.
 */

// Importing from database app schema types
export type User = import('@fit-check/database/types').User;
export type NewUser = import('@fit-check/database/types').NewUser;

export type Item = import('@fit-check/database/types').Item;
export type NewItem = import('@fit-check/database/types').NewItem;

export type Category = import('@fit-check/database/types').Category;
export type NewCategory = import('@fit-check/database/types').NewCategory;

export type Outfit = import('@fit-check/database/types').Outfit;
export type NewOutfit = import('@fit-check/database/types').NewOutfit;

export type ItemToCategory = import('@fit-check/database/types').ItemToCategory;
export type NewItemToCategory = import('@fit-check/database/types').NewItemToCategory;

// Custom types that don't exist in the DB directly
export type OutfitLayoutItem = {
  itemId: string;
  weight: number;
};

export type OutfitLayout = OutfitLayoutItem[][];
