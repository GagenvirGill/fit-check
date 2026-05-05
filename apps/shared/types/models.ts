/**
 * PURE TYPES RE-EXPORT STRATEGY
 * This file re-exports database types using TypeScript `import()` types.
 * This allows consumers to stay type-only and avoid pulling runtime DB code.
 */

// Importing from database app schema types
export type User = import('@fit-check/database/types').User;
export type Item = import('@fit-check/database/types').Item;
export type Category = import('@fit-check/database/types').Category;
export type Outfit = import('@fit-check/database/types').Outfit;
export type ItemToCategory = import('@fit-check/database/types').ItemToCategory;
export type OutfitLayout = import('@fit-check/database/types').OutfitLayout;
export type OutfitLayoutItem = import('@fit-check/database/types').OutfitLayoutItem;
