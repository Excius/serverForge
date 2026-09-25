import { describe, it, expect, beforeEach } from "vitest";
import { testDb, clearDatabase } from "../../setup/db";
import { GameRepository } from "../../../src/repositories/game.repository";

describe("GameRepository", () => {
  let repository: GameRepository;

  beforeEach(async () => {
    await clearDatabase();
    repository = new GameRepository(testDb);
  });

  describe("create", () => {
    it("should create a new game", async () => {
      const game = await repository.create("Test Game", "test-game");
      expect(game).toBeDefined();
      expect(game.id).toBeDefined();
      expect(game.name).toBe("Test Game");
      expect(game.slug).toBe("test-game");
    });
  });

  describe("findById", () => {
    it("should return the game if it exists and is not deleted", async () => {
      const created = await repository.create("Game A", "game-a");
      const found = await repository.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.slug).toBe("game-a");
    });

    it("should return null if game is hard deleted", async () => {
      const created = await repository.create("Game B", "game-b");
      await repository.delete(created.id);
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe("findBySlug", () => {
    it("should return the game if it exists", async () => {
      const created = await repository.create("Game C", "game-c");
      const result = await repository.findBySlug("game-c");
      expect(result[0]).toBeDefined();
      expect(result[0]?.id).toBe(created.id);
    });

    it("should return empty if game is hard deleted", async () => {
      const created = await repository.create("Game D", "game-d");
      await repository.delete(created.id);
      const result = await repository.findBySlug("game-d");
      expect(result).toHaveLength(0);
    });
  });

  describe("findAll", () => {
    it("should return all active games", async () => {
      await repository.create("Game 1", "game-1");
      const g2 = await repository.create("Game 2", "game-2");
      await repository.delete(g2.id);

      const games = await repository.findAll();
      expect(games).toHaveLength(1);
      expect(games[0].slug).toBe("game-1");
    });
  });

  describe("update", () => {
    it("should update a game", async () => {
      const created = await repository.create("Old", "old");
      const updated = await repository.update(created.id, { name: "New" });
      expect(updated?.name).toBe("New");
      expect(updated?.slug).toBe("old");

      const found = await repository.findById(created.id);
      expect(found?.name).toBe("New");
    });
  });
});
