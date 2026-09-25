import { describe, it, expect, beforeEach } from "vitest";
import { testDb, clearDatabase } from "../../setup/db";
import { UserRepository } from "../../../src/repositories/user.repository";

describe("UserRepository", () => {
  let repository: UserRepository;

  beforeEach(async () => {
    await clearDatabase();
    repository = new UserRepository(testDb);
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const user = await repository.create("test@example.com", "hash");
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.passwordHash).toBe("hash");
    });
  });

  describe("findById", () => {
    it("should return the user if it exists", async () => {
      const created = await repository.create("test2@example.com", "hash2");
      const found = await repository.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.email).toBe("test2@example.com");
    });

    it("should return null if user does not exist", async () => {
      const found = await repository.findById("00000000-0000-0000-0000-000000000000");
      expect(found).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return the user if it exists", async () => {
      const created = await repository.create("test3@example.com", "hash3");
      const found = await repository.findByEmail("test3@example.com");
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it("should return null if user does not exist", async () => {
      const found = await repository.findByEmail("non-existent@example.com");
      expect(found).toBeNull();
    });
  });
});
