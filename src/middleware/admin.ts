import { Context, Next } from "hono";
import { AppEnv } from "../types/hono";

export async function adminMiddleware(c: Context<AppEnv>, next: Next) {
  const user = c.get("user");

  if (user.role !== "admin") {
    return c.json(
      {
        error: "Admin access required",
      },
      403,
    );
  }

  await next();
}
