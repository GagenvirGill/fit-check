import { describe, expect, it } from "vitest";

import { sessionCookie, withTestApp } from "../helpers/app";
import { createMockServices, testItem } from "../helpers/services";

describe("item routes", () => {
  it("requires auth", async () => {
    await withTestApp(createMockServices(), async (app) => {
      const response = await app.inject({ method: "DELETE", url: "/api/items/item-1" });

      expect(response.statusCode).toBe(401);
    });
  });

  it("updates item categories", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/items/item-1",
        headers: { cookie: sessionCookie },
        payload: { categoryIds: ["category-1", "category-1"] },
      });

      expect(response.statusCode).toBe(204);
      expect(services.items.update).toHaveBeenCalledWith("user-1", "item-1", {
        categoryIds: ["category-1"],
      });
    });
  });

  it("deletes an item", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/items/item-1",
        headers: { cookie: sessionCookie },
      });

      expect(response.statusCode).toBe(204);
      expect(services.items.delete).toHaveBeenCalledWith("user-1", "item-1");
    });
  });

  it("creates an item from multipart upload", async () => {
    const services = createMockServices();
    const form = new FormData();
    form.set("image", new File(["image-bytes"], "shirt.png", { type: "image/png" }));

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "POST",
        url: "/api/items",
        headers: { cookie: sessionCookie },
        payload: form,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(testItem);
      expect(services.items.create).toHaveBeenCalledWith("user-1", {
        image: {
          fileName: "shirt.png",
          mimeType: "image/png",
          bytes: new Uint8Array([105, 109, 97, 103, 101, 45, 98, 121, 116, 101, 115]),
        },
      });
    });
  });
});
