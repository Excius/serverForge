import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "../../src/index";
import { clearDatabase, testDb } from "../setup/db";
import { userTable, gameTable, providerTable, serverTable, sessionTable } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/password";
import { hashSessionToken } from "../../src/lib/session";

vi.mock("../../src/lib/config", () => ({
  env: {},
}));

vi.mock("../../src/db/index", () => ({
  getDb: () => testDb,
}));

vi.mock("../../src/providers/provider.resolver", () => ({
  resolveProvider: () => ({
    getServerIp: vi.fn().mockResolvedValue("127.0.0.1"),
    getServerStatus: vi.fn().mockResolvedValue("running"),
    startServer: vi.fn().mockResolvedValue(undefined),
    stopServer: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("Servers Routes", () => {
  let adminCookie = "";
  let userCookie = "";
  let serverId = "";
  let gameId = "";
  let providerId = "";
  let adminId = "";

  beforeEach(async () => {
    await clearDatabase();
    
    const adminHash = await hashPassword("password123");
    const [adminUser] = await testDb.insert(userTable).values({
      email: "admin@example.com",
      passwordHash: adminHash,
      role: "admin",
    }).returning();
    adminId = adminUser.id;
    
    const userHash = await hashPassword("password123");
    const [normalUser] = await testDb.insert(userTable).values({
      email: "user@example.com",
      passwordHash: userHash,
      role: "user",
    }).returning();
    
    const adminToken = "admin-token-123";
    const userToken = "user-token-123";
    
    await testDb.insert(sessionTable).values({
      userId: adminUser.id,
      tokenHash: await hashSessionToken(adminToken),
      expiresAt: new Date(Date.now() + 3600000),
    });
    
    await testDb.insert(sessionTable).values({
      userId: normalUser.id,
      tokenHash: await hashSessionToken(userToken),
      expiresAt: new Date(Date.now() + 3600000),
    });
    
    adminCookie = `session=${adminToken}`;
    userCookie = `session=${userToken}`;

    const [game] = await testDb.insert(gameTable).values({
      name: "Minecraft",
      slug: "minecraft",
    }).returning();
    gameId = game.id;

    const [provider] = await testDb.insert(providerTable).values({
      name: "Mock",
      slug: "mock",
    }).returning();
    providerId = provider.id;

    const [server] = await testDb.insert(serverTable).values({
      name: "Test Server",
      gameId: game.id,
      providerId: provider.id,
      providerServerId: "mock-instance-1",
      createdBy: adminId,
    }).returning();
    serverId = server.id;
  });

  describe("GET /servers", () => {
    it("should allow admin to list serverTable", async () => {
      const res = await app.request("/api/v1/servers", {
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
    });

    it("should allow normal user to list only their servers", async () => {
      const res = await app.request("/api/v1/servers", {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });
  });

  describe("POST /servers", () => {
    it("should allow admin to create a server", async () => {
      const res = await app.request("/api/v1/servers", {
        method: "POST",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: "New Server", 
          gameId, 
          providerId, 
          providerServerId: "mock-instance-2" 
        }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.name).toBe("New Server");
    });

    it("should deny normal user from creating a server", async () => {
      const res = await app.request("/api/v1/servers", {
        method: "POST",
        headers: { Cookie: userCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: "New Server", 
          gameId, 
          providerId, 
          providerServerId: "mock-instance-3" 
        }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /servers/:id", () => {
    it("should return server for admin", async () => {
      const res = await app.request(`/api/v1/servers/${serverId}`, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.id).toBe(serverId);
    });

    it("should deny normal user from getting arbitrary server", async () => {
      const res = await app.request(`/api/v1/servers/${serverId}`, {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("POST /servers/:id/start", () => {
    it("should allow admin to start server", async () => {
      const res = await app.request(`/api/v1/servers/${serverId}/start`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
    });

    it("should deny normal user from starting arbitrary server", async () => {
      const res = await app.request(`/api/v1/servers/${serverId}/start`, {
        method: "POST",
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /servers/:id/ip", () => {
    it("should return 403 for unauthorized normal user", async () => {
      const res = await app.request(`/api/v1/servers/${serverId}/ip`, {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });
});
