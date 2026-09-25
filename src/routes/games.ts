import { Hono } from "hono";
import { GameService } from "../services/game.service";
import { AppEnv } from "../types/hono";
import { z } from "zod";
import {
  createGameSchema,
  gameIdSchema,
  updateGameSchema,
} from "../schemas/game.schema";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";
import { ConfigurationService } from "../services/configuration.service";
import { env } from "../lib/config";
import { getSupportedGames, isGameSupported } from "../games/game.registry";

const games = new Hono<AppEnv>();

const uuidSchema = z.string().uuid();

games.use(authMiddleware);

games.get("/supported", async (c) => {
  return c.json({ items: getSupportedGames() }, 200);
});

games.get("/", async (c) => {
  const db = c.get("db");

  const service = new GameService(db);

  const gamesList = await service.getGames();

  return c.json(gamesList, 200);
});

games.post("/", adminMiddleware, async (c) => {
  const body = await c.req.json();

  const result = createGameSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        error: "Invalid request",
        details: result.error.flatten(),
      },
      400,
    );
  }

  if (!isGameSupported(result.data.slug)) {
    const supportedSlugs = getSupportedGames()
      .map((g) => g.slug)
      .join(", ");
    return c.json(
      {
        error: `Unsupported game engine slug '${result.data.slug}'. Backend currently supports: [${supportedSlugs}]`,
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new GameService(db);

  const game = await service.createGame(body.name, body.slug);

  return c.json(
    {
      id: game.id,
      name: game.name,
      slug: game.slug,
    },
    201,
  );
});

games.get("/:id", async (c) => {
  const id = c.req.param("id");

  const result = uuidSchema.safeParse(id);

  if (!result.success) {
    return c.json(
      {
        error: "Invalid game ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new GameService(db);

  const game = await service.getGameById(result.data);

  if (!game) {
    return c.json(
      {
        error: "Game not found",
      },
      404,
    );
  }

  return c.json(game);
});

games.patch("/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = gameIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid game ID",
      },
      400,
    );
  }

  const body = await c.req.json();

  const bodyResult = updateGameSchema.safeParse(body);

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

  const service = new GameService(db);

  const game = await service.updateGame(idResult.data, bodyResult.data);

  if (!game) {
    return c.json(
      {
        error: "Game not found",
      },
      404,
    );
  }

  return c.json(game);
});

games.delete("/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = gameIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid game ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new GameService(db);

  const game = await service.deleteGame(idResult.data);

  if (!game) {
    return c.json(
      {
        error: "Game not found",
      },
      404,
    );
  }

  return c.json({
    message: "Game deleted successfully",
  });
});

games.get("/:id/config", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return c.json({ error: "Invalid game ID" }, 400);
  }

  const db = c.get("db");
  const gameService = new GameService(db);
  const game = await gameService.getGameById(idResult.data);
  if (!game) {
    return c.json({ error: "Game not found" }, 404);
  }

  const configService = new ConfigurationService(db, env.CONFIG_ENCRYPTION_KEY);
  const config = await configService.getConfig("game", game.id, game.slug);
  return c.json(config, 200);
});

games.put("/:id/config", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return c.json({ error: "Invalid game ID" }, 400);
  }

  const db = c.get("db");
  const gameService = new GameService(db);
  const game = await gameService.getGameById(idResult.data);
  if (!game) {
    return c.json({ error: "Game not found" }, 404);
  }

  const body = await c.req.json();
  const configService = new ConfigurationService(db, env.CONFIG_ENCRYPTION_KEY);
  const updatedConfig = await configService.saveConfig(
    "game",
    game.id,
    game.slug,
    body?.values,
  );
  return c.json(updatedConfig, 200);
});

games.delete("/:id/config", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return c.json({ error: "Invalid game ID" }, 400);
  }

  const db = c.get("db");
  const configService = new ConfigurationService(db, env.CONFIG_ENCRYPTION_KEY);
  await configService.deleteConfig("game", idResult.data);
  return c.json({ message: "Game configuration deleted successfully" }, 200);
});

export default games;
