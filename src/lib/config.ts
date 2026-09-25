import { getContext } from "hono/context-storage";
import { env as honoEnv } from "hono/adapter";
import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.url(),
  SESSION_DURATION: z.coerce.number().int().positive(),
  // AWS_REGION: z.string(),
  // AWS_ACCESS_KEY_ID: z.string(),
  // AWS_SECRET_ACCESS_KEY: z.string(),
});

const parsedCache = new WeakMap<object, Bindings>();

export type Bindings = z.infer<typeof envSchema>;

export const env = new Proxy({} as Bindings, {
  get(_, prop: keyof Bindings) {
    const ctx = getContext<{ Bindings: Bindings }>();

    if (!ctx) {
      throw new Error(
        "Cannot access `env` outside an active Hono HTTP request scope",
      );
    }

    let parsed = parsedCache.get(ctx);
    if (!parsed) {
      const rawEnv = honoEnv(ctx);
      const result = envSchema.safeParse(rawEnv);
      if (!result.success) {
        console.error("Env validation failure: ", result.error.format());
        throw new Error(
          `Invalid Config: ${JSON.stringify(result.error.format())}`,
        );
      }

      parsed = result.data;
      parsedCache.set(ctx, parsed);
    }

    return parsed[prop];
  },
});
