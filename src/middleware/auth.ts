import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { hashSessionToken } from "../lib/session";
import { SessionRepository } from "../repositories/session.repository";
import { UserRepository } from "../repositories/user.repository";
import { AppEnv } from "../types/hono";

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, "session");

  if (!token) {
    return c.json(
      {
        errro: "Authenctication required",
      },
      401,
    );
  }

  const tokenHash = await hashSessionToken(token);

  const db = c.get("db");

  const sessionRepository = new SessionRepository(db);

  const session = await sessionRepository.findByTokenHash(tokenHash);

  if (!session) {
    c.json(
      {
        error: "Session has been revoked",
      },
      401,
    );
  }

  if (session.expiresAt <= new Date()) {
    return c.json(
      {
        error: "Session has expired",
      },
      401,
    );
  }

  const userRepository = new UserRepository(db);

  const user = await userRepository.findById(session.userId);

  if (!user || user.deletedAt) {
    return c.json(
      {
        error: "User not found",
      },
      401,
    );
  }

  c.set("user", user);

  await next();
}
