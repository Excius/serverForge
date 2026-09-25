import { Hono } from "hono";
import { AppEnv } from "../types/hono";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono<AppEnv>();

auth.post("/register", async (c) => {
  const body = await c.req.json();

  const result = registerSchema.safeParse(body);

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

  const service = new AuthService(db);

  const user = await service.createUser(
    result.data.email,
    result.data.password,
  );

  return c.json(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    201,
  );
});

auth.post("/login", async (c) => {
  const body = await c.req.json();

  const result = loginSchema.safeParse(body);

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

  const service = new AuthService(db);

  const { user, token, expiresAt } = await service.login(
    result.data.email,
    result.data.password,
  );

  setCookie(c, "session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    expires: expiresAt,
    path: "/",
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

auth.post("/logout", async (c) => {
  const token = getCookie(c, "session");

  if (token) {
    const db = c.get("db");

    const service = new AuthService(db);

    await service.logout(token);
  }

  deleteCookie(c, "session", { path: "/" });

  return c.json({
    message: "Logged out successfully",
  });
});

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");

  return c.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
});

export default auth;
