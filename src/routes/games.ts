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

const games = new Hono<AppEnv>();

const uuidSchema = z.uuid();

games.use(authMiddleware);

games.get("/", async (c) => {
  const db = c.get("db");

  const service = new GameService(db);

  const games = await service.getGames();

  return c.json(games, 200);
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

  const game = await service.getGameById(id);

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
        error: "Invaid request",
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

export default games;
