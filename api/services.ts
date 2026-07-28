import type {
  AuthUser,
  CategoryResponse,
  ItemResponse,
  OutfitLayout,
  OutfitResponse,
} from "./types/models";

export type UploadedItemImage = {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type CreateItemPayload = {
  image: UploadedItemImage;
};

export type UpdateItemPayload = {
  categoryIds?: string[];
};

export type CreateCategoryPayload = {
  name: string;
};

export type UpdateCategoryPayload = {
  name?: string;
  favoriteItem?: string | null;
  itemIds?: string[];
};

export type CreateOutfitPayload = {
  dateWorn: string;
  description?: string | null;
  layout: OutfitLayout;
};

export type UpdateOutfitPayload = {
  dateWorn?: string;
  description?: string | null;
  layout?: OutfitLayout;
};

export type AuthService = {
  createOauthState(): string;
  buildGoogleAuthUrl(state: string): string;
  exchangeGoogleCode(code: string): Promise<AuthUser>;
  createSession(userId: string): Promise<string>;
  getSessionUser(sessionId: string): Promise<AuthUser | null>;
  deleteSession(sessionId: string): Promise<void>;
};

export type ItemService = {
  create(userId: string, payload: CreateItemPayload): Promise<ItemResponse>;
  update(userId: string, itemId: string, payload: UpdateItemPayload): Promise<void>;
  delete(userId: string, itemId: string): Promise<void>;
};

export type CategoryService = {
  create(userId: string, payload: CreateCategoryPayload): Promise<CategoryResponse>;
  update(userId: string, categoryId: string, payload: UpdateCategoryPayload): Promise<CategoryResponse>;
  delete(userId: string, categoryId: string): Promise<void>;
};

export type OutfitService = {
  create(userId: string, payload: CreateOutfitPayload): Promise<OutfitResponse>;
  update(userId: string, outfitId: string, payload: UpdateOutfitPayload): Promise<OutfitResponse>;
  delete(userId: string, outfitId: string): Promise<void>;
};

export type ApiServices = {
  auth: AuthService;
  items: ItemService;
  categories: CategoryService;
  outfits: OutfitService;
};
