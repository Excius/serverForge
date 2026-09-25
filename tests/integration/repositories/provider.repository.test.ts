import { describe, it, expect, beforeEach } from "vitest";
import { testDb, clearDatabase } from "../../setup/db";
import { ProviderRepository } from "../../../src/repositories/provider.repository";

describe("ProviderRepository", () => {
  let repository: ProviderRepository;

  beforeEach(async () => {
    await clearDatabase();
    repository = new ProviderRepository(testDb);
  });

  describe("create", () => {
    it("should create a new provider", async () => {
      const provider = await repository.create("Test Provider", "test-provider");
      expect(provider).toBeDefined();
      expect(provider.id).toBeDefined();
      expect(provider.name).toBe("Test Provider");
      expect(provider.slug).toBe("test-provider");
    });
  });

  describe("findById", () => {
    it("should return the provider if it exists and is not deleted", async () => {
      const created = await repository.create("Provider A", "provider-a");
      const found = await repository.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.slug).toBe("provider-a");
    });

    it("should return null if provider is hard deleted", async () => {
      const created = await repository.create("Provider B", "provider-b");
      await repository.delete(created.id);
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe("findBySlug", () => {
    it("should return the provider if it exists", async () => {
      const created = await repository.create("Provider C", "provider-c");
      const found = await repository.findBySlug("provider-c");
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it("should return null if provider is hard deleted", async () => {
      const created = await repository.create("Provider D", "provider-d");
      await repository.delete(created.id);
      const found = await repository.findBySlug("provider-d");
      expect(found).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all active providers", async () => {
      await repository.create("Provider 1", "provider-1");
      const p2 = await repository.create("Provider 2", "provider-2");
      await repository.delete(p2.id);

      const providers = await repository.findAll();
      expect(providers).toHaveLength(1);
      expect(providers[0].slug).toBe("provider-1");
    });
  });

  describe("update", () => {
    it("should update a provider", async () => {
      const created = await repository.create("Old", "old");
      const updated = await repository.update(created.id, { name: "New" });
      expect(updated?.name).toBe("New");
      expect(updated?.slug).toBe("old");

      const found = await repository.findById(created.id);
      expect(found?.name).toBe("New");
    });
  });
});
