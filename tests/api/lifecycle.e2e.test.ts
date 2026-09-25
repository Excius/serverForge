import { describe, it, expect, beforeEach, vi } from "vitest";
import { clearDatabase, testDb } from "../setup/db";
import { userTable, gameTable, providerTable, serverTable } from "../../src/db/schema";
import { ServerReconciliationService } from "../../src/services/server-reconciliation.service";
import { resolveProvider } from "../../src/providers/provider.resolver";
import { resolveGame } from "../../src/games/game.resolver";
import { eq } from "drizzle-orm";

vi.mock("../../src/lib/config", () => ({
  env: {},
}));

vi.mock("../../src/providers/provider.resolver");
vi.mock("../../src/games/game.resolver");

describe("E2E Control Plane Lifecycle", () => {
  let adminId = "";
  let gameId = "";
  let providerId = "";
  let serverId = "";
  
  let mockProvider: any;
  let mockGameAdapter: any;

  beforeEach(async () => {
    await clearDatabase();
    vi.useFakeTimers();

    const [adminUser] = await testDb.insert(userTable).values({
      email: "admin@example.com",
      passwordHash: "hash",
      role: "admin",
    }).returning();
    adminId = adminUser.id;

    // 1. Create mock provider
    const [provider] = await testDb.insert(providerTable).values({
      name: "Mock Provider",
      slug: "mock-e2e",
    }).returning();
    providerId = provider.id;

    // 2. Create mock game
    const [game] = await testDb.insert(gameTable).values({
      name: "Mock Game",
      slug: "mock-game-e2e",
    }).returning();
    gameId = game.id;

    // 3. Create server
    const [server] = await testDb.insert(serverTable).values({
      name: "E2E Server",
      gameId,
      providerId,
      providerServerId: "inst-123",
      createdBy: adminId,
      status: "running", // assume it finished starting
      lastStartedAt: new Date(),
    }).returning();
    serverId = server.id;

    mockProvider = {
      getServerStatus: vi.fn().mockResolvedValue("running"),
      getServerIp: vi.fn().mockResolvedValue("127.0.0.1"),
      startServer: vi.fn().mockResolvedValue(undefined),
      stopServer: vi.fn().mockResolvedValue(undefined),
    };

    mockGameAdapter = {
      getServerInfo: vi.fn().mockResolvedValue({
        playerCount: 0,
        heartbeatAt: new Date(),
      }),
    };

    vi.mocked(resolveProvider).mockReturnValue(mockProvider);
    vi.mocked(resolveGame).mockReturnValue(mockGameAdapter);
  });

  it("should complete the full reconciliation lifecycle correctly", async () => {
    const service = new ServerReconciliationService(testDb, {} as any);

    // 4. Mock provider reports running
    mockProvider.getServerStatus.mockResolvedValue("running");
    
    // 5. Mock game reports 2 players
    const activityTime = new Date();
    mockGameAdapter.getServerInfo.mockResolvedValue({
      playerCount: 2,
      heartbeatAt: activityTime,
    });

    // 6. Reconcile
    await service.reconcile();

    // 7. Verify player count = 2
    // 8. Verify activity timestamp updated
    let [server] = await testDb.select().from(serverTable).where(eq(serverTable.id, serverId));
    expect(server.playerCount).toBe(2);
    expect(server.lastPlayerActivityAt?.getTime()).toBe(activityTime.getTime());
    expect(mockProvider.stopServer).not.toHaveBeenCalled();

    // 9. Mock game reports 0 players
    mockGameAdapter.getServerInfo.mockResolvedValue({
      playerCount: 0,
      heartbeatAt: new Date(),
    });

    // 10. Reconcile
    await service.reconcile();

    // 11. Verify server remains running (idle time is < 10 mins)
    [server] = await testDb.select().from(serverTable).where(eq(serverTable.id, serverId));
    expect(server.status).toBe("running");
    expect(mockProvider.stopServer).not.toHaveBeenCalled();

    // 12. Advance simulated time > 10 minutes (11 minutes)
    vi.advanceTimersByTime(11 * 60 * 1000);

    // 13. Reconcile
    await service.reconcile();

    // 14. Verify server becomes stopping
    [server] = await testDb.select().from(serverTable).where(eq(serverTable.id, serverId));
    expect(server.status).toBe("stopping");
    
    // 15. Verify mock provider stopServer() called
    expect(mockProvider.stopServer).toHaveBeenCalledWith("inst-123");

    // 16. Provider reports stopped
    mockProvider.getServerStatus.mockResolvedValue("stopped");

    // 17. Reconcile
    await service.reconcile();

    // 18. Verify server becomes stopped
    [server] = await testDb.select().from(serverTable).where(eq(serverTable.id, serverId));
    expect(server.status).toBe("stopped");
  });
});
