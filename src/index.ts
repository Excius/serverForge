import { Hono } from "hono";
import health from "./routes/health";
import routes from "./routes/index";
import { contextStorage } from "hono/context-storage";
import { databaseMiddleware } from "./middleware/database";
import { AppEnv } from "./types/hono";
import { AppError } from "./lib/errors";
import { Bindings } from "./lib/config";
import { getDb } from "./db";
import { ServerReconciliationService } from "./services/server-reconciliation.service";
import { cors } from "hono/cors";

// Inject schemas into Hono's core Typings
export const app = new Hono<AppEnv>();

app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:5173",
      "https://game.excius.tech",
      "https://game-pre.excius.tech",
    ],
    credentials: true,
  }),
);

// Enable tracking for context storage
app.use(contextStorage());

// Enable db instance on the request context
app.use(databaseMiddleware);

app.route("", health);

app.route("/api/v1", routes);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
      },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 500,
    );
  }

  console.error(err);

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
});

export default {
  fetch: app.fetch,

  async scheduled(
    _controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext,
  ) {
    const db = getDb(env.DATABASE_URL);

    const service = new ServerReconciliationService(db, env);

    ctx.waitUntil(service.reconcile());
  },
};
