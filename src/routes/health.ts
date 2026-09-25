import { Hono } from "hono";
import { AppEnv } from "../types/hono";

const health = new Hono<AppEnv>();

health.get("/health", (c) => {
  return c.json({
    status: "ok",
  });
});

export default health;
