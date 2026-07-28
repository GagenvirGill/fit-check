import { describe, expect, it } from "vitest";

import { sessionCookie, withTestApp } from "../helpers/app";
import { createMockServices, testOutfit } from "../helpers/services";

describe("outfit routes", () => {
  it("creates an outfit", async () => {
    const services = createMockServices();
    const layout = [[{ itemId: "item-1", weight: 1 }]];

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "POST",
        url: "/api/outfits",
        headers: { cookie: sessionCookie },
        payload: {
          dateWorn: "2026-07-23",
          description: null,
          layout,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(testOutfit);
      expect(services.outfits.create).toHaveBeenCalledWith("user-1", {
        dateWorn: "2026-07-23",
        description: null,
        layout,
      });
    });
  });

  it("updates an outfit", async () => {
    const services = createMockServices();
    const layout = [[{ itemId: "item-1", weight: 2 }]];

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/outfits/outfit-1",
        headers: { cookie: sessionCookie },
        payload: { layout },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(testOutfit);
      expect(services.outfits.update).toHaveBeenCalledWith("user-1", "outfit-1", {
        layout,
      });
    });
  });

  it("deletes an outfit", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/outfits/outfit-1",
        headers: { cookie: sessionCookie },
      });

      expect(response.statusCode).toBe(204);
      expect(services.outfits.delete).toHaveBeenCalledWith("user-1", "outfit-1");
    });
  });
});
