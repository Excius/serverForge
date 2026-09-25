import { Hono } from "hono";
import type { AppEnv } from "../types/hono";

import {
  createServerSchema,
  updateServerSchema,
  serverIdSchema,
} from "../schemas/server.schema";

import { ServerService } from "../services/server.service";

import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { env } from "../lib/config";

const servers = new Hono<AppEnv>();

servers.get("/", authMiddleware, adminMiddleware, async (c) => {
  const db = c.get("db");

  const service = new ServerService(db, env);

  const servers = await service.getServers();

  return c.json(servers);
});

servers.get("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = serverIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid server ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ServerService(db, env);

  const server = await service.getServerById(idResult.data);

  if (!server) {
    return c.json(
      {
        error: "Server not found",
      },
      404,
    );
  }

  return c.json(server);
});

servers.post("/", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();

  const result = createServerSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        error: "Invalid request",
        details: result.error.flatten(),
      },
      400,
    );
  }

  const db = c.get("db");

  const user = c.get("user");

  const service = new ServerService(db, env);

  const server = await service.createServer({
    name: result.data.name,
    createdBy: user.id,
    gameId: result.data.gameId,
    providerId: result.data.providerId,
    providerServerId: result.data.providerServerId,
  });

  return c.json(server, 201);
});

servers.patch("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = serverIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid server ID",
      },
      400,
    );
  }

  const body = await c.req.json();

  const bodyResult = updateServerSchema.safeParse(body);

  if (!bodyResult.success) {
    return c.json(
      {
        error: "Invalid request",
        details: bodyResult.error.flatten(),
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ServerService(db, env);

  const server = await service.updateServer(idResult.data, bodyResult.data);

  if (!server) {
    return c.json(
      {
        error: "Server not found",
      },
      404,
    );
  }

  return c.json(server);
});

servers.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = serverIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid server ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ServerService(db, env);

  const server = await service.deleteServer(idResult.data);

  if (!server) {
    return c.json(
      {
        error: "Server not found",
      },
      404,
    );
  }

  return c.json({
    message: "Server deleted successfully",
  });
});

servers.post("/:id/start", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = serverIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid server ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ServerService(db, env);

  const server = await service.startServer(idResult.data);

  if (!server) {
    return c.json(
      {
        error: "Server not found",
      },
      404,
    );
  }

  return c.json(server);
});

servers.post("/:id/stop", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = serverIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid server ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ServerService(db, env);

  const server = await service.stopServer(idResult.data);

  if (!server) {
    return c.json(
      {
        error: "Server not found",
      },
      404,
    );
  }

  return c.json(server);
});

servers.get("/:id/status", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = serverIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid server ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ServerService(db, env);

  const server = await service.getServerStatus(idResult.data);

  if (!server) {
    return c.json(
      {
        error: "Server not found",
      },
      404,
    );
  }

  return c.json({
    id: server.id,
    status: server.status,
  });
});

servers.get("/:id/ip", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = serverIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid server ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ServerService(db, c.env);

  const result = await service.getServerIp(idResult.data);

  if (!result) {
    return c.json(
      {
        error: "Server not found",
      },
      404,
    );
  }

  return c.json({
    serverId: result.server.id,
    ip: result.ip,
  });
});

export default servers;
