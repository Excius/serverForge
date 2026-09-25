import { createMiddleware } from "hono/factory";
import { env } from "../lib/config";
import { getDb } from "../db";
import { AppEnv } from "../types/hono";
import { Context, Next } from "hono";

export const databaseMiddleware = createMiddleware<AppEnv>(
  async (c: Context<AppEnv>, next: Next) => {
    const db = getDb(env.DATABASE_URL);

    c.set("db", db);

    await next();
  },
);
