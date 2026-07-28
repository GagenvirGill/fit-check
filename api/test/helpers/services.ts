import { vi } from "vitest";

import type { ApiServices } from "../../services";
import type {
  CategoryResponse,
  ItemResponse,
  OutfitResponse,
} from "../../types/models";

export const testUser = {
  userId: "user-1",
  email: "test@example.com",
  provider: "google",
};

export const testItem: ItemResponse = {
  itemId: "item-1",
  imagePath: "items/item-1.png",
  imageWidth: 640,
  imageHeight: 800,
  createdAt: "2026-07-23T00:00:00.000Z",
};

export const testCategory: CategoryResponse = {
  categoryId: "category-1",
  name: "Tops",
  favoriteItem: null,
};

export const testOutfit: OutfitResponse = {
  outfitId: "outfit-1",
  dateWorn: "2026-07-23",
  description: null,
  layout: [[{ itemId: "item-1", weight: 1 }]],
};

export function createMockServices(): ApiServices {
  return {
    auth: {
      createOauthState: vi.fn(() => "state-1"),
      buildGoogleAuthUrl: vi.fn((state) => `https://accounts.example.test/oauth?state=${state}`),
      exchangeGoogleCode: vi.fn(async () => testUser),
      createSession: vi.fn(async () => "session-1"),
      getSessionUser: vi.fn(async (sessionId) => (sessionId === "session-1" ? testUser : null)),
      deleteSession: vi.fn(async () => undefined),
    },
    items: {
      create: vi.fn(async () => testItem),
      update: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
    },
    categories: {
      create: vi.fn(async () => testCategory),
      update: vi.fn(async () => testCategory),
      delete: vi.fn(async () => undefined),
    },
    outfits: {
      create: vi.fn(async () => testOutfit),
      update: vi.fn(async () => testOutfit),
      delete: vi.fn(async () => undefined),
    },
  };
}
