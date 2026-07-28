import type { FastifyPluginAsync } from "fastify";

import { getAuthUser } from "../lib/auth/current-user";
import {
  asObject,
  omitUndefined,
  optionalNullableString,
  optionalString,
  requireAny,
  requireString,
} from "../lib/http/body";
import {
  optionalOutfitLayout,
  requireOutfitLayout,
} from "../lib/http/outfit-layout";
import type { ApiServices } from "../services";

type OutfitRouteOptions = {
  services: ApiServices;
};

type OutfitParams = {
  outfitId: string;
};

const outfitsRoutes: FastifyPluginAsync<OutfitRouteOptions> = async (fastify, options) => {
  fastify.post("/", async (request, reply) => {
    const authUser = getAuthUser(request);
    const body = asObject(request.body);
    const created = await options.services.outfits.create(authUser.userId, {
      dateWorn: requireString(body, "dateWorn"),
      description: optionalNullableString(body, "description"),
      layout: requireOutfitLayout(body, "layout"),
    });

    return reply.status(201).send(created);
  });

  fastify.patch<{ Params: OutfitParams }>("/:outfitId", async (request, reply) => {
    const authUser = getAuthUser(request);
    const body = asObject(request.body);
    requireAny(body, ["dateWorn", "description", "layout"]);

    const updated = await options.services.outfits.update(
      authUser.userId,
      request.params.outfitId,
      omitUndefined({
        dateWorn: optionalString(body, "dateWorn"),
        description: optionalNullableString(body, "description"),
        layout: optionalOutfitLayout(body, "layout"),
      }),
    );

    return reply.status(200).send(updated);
  });

  fastify.delete<{ Params: OutfitParams }>("/:outfitId", async (request, reply) => {
    const authUser = getAuthUser(request);
    await options.services.outfits.delete(authUser.userId, request.params.outfitId);
    return reply.status(204).send();
  });
};

export default outfitsRoutes;
