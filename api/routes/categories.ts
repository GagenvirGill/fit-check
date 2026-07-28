import type { FastifyPluginAsync } from "fastify";

import { getAuthUser } from "../lib/auth/current-user";
import {
  asObject,
  omitUndefined,
  optionalNullableString,
  optionalString,
  optionalStringArray,
  requireAny,
  requireString,
} from "../lib/http/body";
import type { ApiServices } from "../services";

type CategoryRouteOptions = {
  services: ApiServices;
};

type CategoryParams = {
  categoryId: string;
};

const categoriesRoutes: FastifyPluginAsync<CategoryRouteOptions> = async (fastify, options) => {
  fastify.post("/", async (request, reply) => {
    const authUser = getAuthUser(request);
    const body = asObject(request.body);
    const created = await options.services.categories.create(authUser.userId, {
      name: requireString(body, "name"),
    });

    return reply.status(201).send(created);
  });

  fastify.patch<{ Params: CategoryParams }>("/:categoryId", async (request, reply) => {
    const authUser = getAuthUser(request);
    const body = asObject(request.body);
    requireAny(body, ["name", "favoriteItem", "itemIds"]);

    const updated = await options.services.categories.update(
      authUser.userId,
      request.params.categoryId,
      omitUndefined({
        name: optionalString(body, "name"),
        favoriteItem: optionalNullableString(body, "favoriteItem"),
        itemIds: optionalStringArray(body, "itemIds"),
      }),
    );

    return reply.status(200).send(updated);
  });

  fastify.delete<{ Params: CategoryParams }>("/:categoryId", async (request, reply) => {
    const authUser = getAuthUser(request);
    await options.services.categories.delete(authUser.userId, request.params.categoryId);
    return reply.status(204).send();
  });
};

export default categoriesRoutes;
