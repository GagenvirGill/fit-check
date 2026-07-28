import { describe, expect, it } from "vitest";

import { sessionCookie, withTestApp } from "../helpers/app";
import { createMockServices, testCategory } from "../helpers/services";

describe("category routes", () => {
  it("creates a category", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "POST",
        url: "/api/categories",
        headers: { cookie: sessionCookie },
        payload: { name: "Tops" },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(testCategory);
      expect(services.categories.create).toHaveBeenCalledWith("user-1", { name: "Tops" });
    });
  });

  it("updates a category", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/categories/category-1",
        headers: { cookie: sessionCookie },
        payload: {
          favoriteItem: null,
          itemIds: ["item-1", "item-1"],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(testCategory);
      expect(services.categories.update).toHaveBeenCalledWith("user-1", "category-1", {
        favoriteItem: null,
        itemIds: ["item-1"],
      });
    });
  });

  it("deletes a category", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/categories/category-1",
        headers: { cookie: sessionCookie },
      });

      expect(response.statusCode).toBe(204);
      expect(services.categories.delete).toHaveBeenCalledWith("user-1", "category-1");
    });
  });
});
