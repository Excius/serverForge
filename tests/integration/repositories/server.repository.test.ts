import { describe, it, expect, beforeEach } from "vitest";
import { testDb, clearDatabase } from "../../setup/db";
import { ServerRepository } from "../../../src/repositories/server.repository";
import { UserRepository } from "../../../src/repositories/user.repository";
import { GameRepository } from "../../../src/repositories/game.repository";
import { ProviderRepository } from "../../../src/repositories/provider.repository";

describe("ServerRepository", () => {
  let serverRepo: ServerRepository;
  let userRepo: UserRepository;
  let gameRepo: GameRepository;
  let providerRepo: ProviderRepository;

  let testUserId: string;
  let testGameId: string;
  let testProviderId: string;

  beforeEach(async () => {
    await clearDatabase();
    serverRepo = new ServerRepository(testDb);
    userRepo = new UserRepository(testDb);
    gameRepo = new GameRepository(testDb);
    providerRepo = new ProviderRepository(testDb);

    const user = await userRepo.create("server_tester@example.com", "pass");
    testUserId = user.id;

    const game = await gameRepo.create("Test Game", "test-game");
    testGameId = game.id;

    const provider = await providerRepo.create("Test Provider", "test-provider");
    testProviderId = provider.id;
  });

  const createTestServer = async (status: any = "unknown") => {
    return serverRepo.create({
      name: "Test Server",
      createdBy: testUserId,
      providerId: testProviderId,
      providerServerId: "provider-server-123",
      gameId: testGameId,
      status,
    });
  };

  describe("create", () => {
    it("should create a new server", async () => {
      const server = await createTestServer();
      expect(server).toBeDefined();
      expect(server.id).toBeDefined();
      expect(server.name).toBe("Test Server");
    });
  });

  describe("findById", () => {
    it("should return the server if it exists and is not deleted", async () => {
      const created = await createTestServer();
      const found = await serverRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Server");
    });

    it("should return null if server is hard deleted", async () => {
      const created = await createTestServer();
      await serverRepo.delete(created.id);
      const found = await serverRepo.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe("findByProviderServerId", () => {
    it("should return server by provider matching IDs", async () => {
      const created = await createTestServer();
      const found = await serverRepo.findByProviderServerId(testProviderId, "provider-server-123");
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe("findAll & findServersForReconciliation", () => {
    it("should return all active servers", async () => {
      const s1 = await createTestServer();
      const s2 = await serverRepo.create({
        name: "Test Server 2",
        createdBy: testUserId,
        providerId: testProviderId,
        providerServerId: "provider-server-456",
        gameId: testGameId,
        status: "unknown",
      });
      await serverRepo.delete(s2.id);

      const all = await serverRepo.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(s1.id);

      const recon = await serverRepo.findServersForReconciliation();
      expect(recon).toHaveLength(1);
      expect(recon[0].id).toBe(s1.id);
    });
  });

  describe("update & updateHealth", () => {
    it("should update a server status", async () => {
      const created = await createTestServer();
      const updated = await serverRepo.update(created.id, { status: "running" });
      expect(updated?.status).toBe("running");
    });

    it("should update health info", async () => {
      const created = await createTestServer();
      const now = new Date();
      const updated = await serverRepo.updateHealth(created.id, {
        playerCount: 10,
        lastHeartbeatAt: now,
      });
      expect(updated?.playerCount).toBe(10);
      expect(updated?.lastHeartbeatAt).toEqual(now);
    });
  });

  describe("claimForStopping (Atomicity)", () => {
    it("should successfully claim a running server and set status to stopping", async () => {
      const created = await createTestServer();
      await serverRepo.update(created.id, { status: "running" });

      const claimed = await serverRepo.claimForStopping(created.id);
      expect(claimed).toBeDefined();
      expect(claimed?.id).toBe(created.id);

      const check = await serverRepo.findById(created.id);
      expect(check?.status).toBe("stopping");
    });

    it("should return null if server is not in running state (already stopping)", async () => {
      const created = await createTestServer();
      await serverRepo.update(created.id, { status: "stopping" });

      const claimed = await serverRepo.claimForStopping(created.id);
      expect(claimed).toBeNull();
    });

    it("should return null if server is already stopped", async () => {
      const created = await createTestServer();
      await serverRepo.update(created.id, { status: "stopped" });

      const claimed = await serverRepo.claimForStopping(created.id);
      expect(claimed).toBeNull();
    });
  });
});
