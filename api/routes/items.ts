import type { FastifyPluginAsync } from "fastify";

import { getAuthUser } from "../lib/auth/current-user";
import { asObject, omitUndefined, optionalStringArray, requireAny } from "../lib/http/body";
import { ApiError } from "../lib/http/api-error";
import type { ApiServices } from "../services";

type ItemRouteOptions = {
  services: ApiServices;
};

type ItemParams = {
  itemId: string;
};

const itemsRoutes: FastifyPluginAsync<ItemRouteOptions> = async (fastify, options) => {
  fastify.post("/", async (request, reply) => {
    const authUser = getAuthUser(request);
    const file = await request.file();
    if (!file) {
      throw new ApiError(400, "image file is required");
    }

    const buffer = await file.toBuffer();
    const created = await options.services.items.create(authUser.userId, {
      image: {
        fileName: file.filename,
        mimeType: file.mimetype,
        bytes: new Uint8Array(buffer),
      },
    });

    return reply.status(201).send(created);
  });

  fastify.patch<{ Params: ItemParams }>("/:itemId", async (request, reply) => {
    const authUser = getAuthUser(request);
    const body = asObject(request.body);
    requireAny(body, ["categoryIds"]);

    await options.services.items.update(
      authUser.userId,
      request.params.itemId,
      omitUndefined({
        categoryIds: optionalStringArray(body, "categoryIds"),
      }),
    );

    return reply.status(204).send();
  });

  fastify.delete<{ Params: ItemParams }>("/:itemId", async (request, reply) => {
    const authUser = getAuthUser(request);
    await options.services.items.delete(authUser.userId, request.params.itemId);
    return reply.status(204).send();
  });
};

export default itemsRoutes;
