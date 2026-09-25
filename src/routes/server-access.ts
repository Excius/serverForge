import { Hono } from "hono";
import type { AppEnv } from "../types/hono";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { ServerAccessService } from "../services/server-access.service";
import { z } from "zod";

const serverAccess = new Hono<AppEnv>();

const paramsSchema = z.object({
  serverId: z.string().uuid(),
  userId: z.string().uuid(),
});
const serverIdSchema = z.string().uuid();

serverAccess.post(
  "/:serverId/:userId",
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const result = paramsSchema.safeParse({
      serverId: c.req.param("serverId"),
      userId: c.req.param("userId"),
    });
    if (!result.success) return c.json({ error: "Invalid parameters" }, 400);

    const db = c.get("db");
    const service = new ServerAccessService(db);
    await service.grantAccess(result.data.serverId, result.data.userId);

    return c.json({ message: "Access granted" }, 201);
  },
);

serverAccess.delete(
  "/:serverId/:userId",
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const result = paramsSchema.safeParse({
      serverId: c.req.param("serverId"),
      userId: c.req.param("userId"),
    });
    if (!result.success) return c.json({ error: "Invalid parameters" }, 400);

    const db = c.get("db");
    const service = new ServerAccessService(db);
    await service.revokeAccess(result.data.serverId, result.data.userId);

    return c.json({ message: "Access revoked" });
  },
);

serverAccess.get("/:serverId", authMiddleware, adminMiddleware, async (c) => {
  const result = serverIdSchema.safeParse(c.req.param("serverId"));
  if (!result.success) return c.json({ error: "Invalid server ID" }, 400);

  const db = c.get("db");
  const service = new ServerAccessService(db);
  const users = await service.getUsersForServer(result.data);

  return c.json(users);
});

export default serverAccess;
