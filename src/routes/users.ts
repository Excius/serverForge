import { Hono } from "hono";
import { UserService } from "../services/user.service";
import { AppEnv } from "../types/hono";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";

const users = new Hono<AppEnv>();

users.use(authMiddleware);
users.use(adminMiddleware);

users.get("/", async (c) => {
  const db = c.get("db");
  const service = new UserService(db);
  const usersList = await service.getUsers();
  return c.json({ items: usersList }, 200);
});

users.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const service = new UserService(db);
  const user = await service.getUserById(id);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt });
});

users.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  if (!body.role || (body.role !== "admin" && body.role !== "user")) {
    return c.json({ error: "Invalid role" }, 400);
  }
  const db = c.get("db");
  const service = new UserService(db);
  const updatedUser = await service.updateUserRole(id, body.role);
  if (!updatedUser) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(updatedUser);
});

export default users;
