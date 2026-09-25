import { expect, it, describe, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { app } from "../../src/index";
import { testDb, clearDatabase } from "../setup/db";
import { userTable, serverTable, gameTable, providerTable, serverAccessTable } from "../../src/db/schema";
import { generateSessionToken, hashSessionToken } from "../../src/lib/session";
import { sessionTable } from "../../src/db/schema";

describe("Server Access Routes", () => {
  let adminId: string;
  let adminCookie: string;
  let userId: string;
  let userCookie: string;
  let gameId: string;
  let providerId: string;
  let serverId: string;

  beforeEach(async () => {
    await clearDatabase();

    // Create Admin
    const [admin] = await testDb.insert(userTable).values({
      email: "admin@example.com",
      passwordHash: "hash-adminpass",
      role: "admin",
    }).returning();
    adminId = admin.id;

    const adminToken = "admin-token";
    await testDb.insert(sessionTable).values({
      userId: admin.id,
      tokenHash: `hash-${adminToken}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    adminCookie = `session=${adminToken}`;

    // Create User
    const [user] = await testDb.insert(userTable).values({
      email: "user@example.com",
      passwordHash: "hash-userpass",
      role: "user",
    }).returning();
    userId = user.id;

    const userToken = "user-token";
    await testDb.insert(sessionTable).values({
      userId: user.id,
      tokenHash: `hash-${userToken}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    userCookie = `session=${userToken}`;

    // Create Game and Provider
    const [game] = await testDb.insert(gameTable).values({ name: "Minecraft", slug: "mc" }).returning();
    gameId = game.id;
    const [provider] = await testDb.insert(providerTable).values({ name: "AWS", slug: "aws" }).returning();
    providerId = provider.id;

    // Create Server
    const [server] = await testDb.insert(serverTable).values({
      name: "Test Server",
      createdBy: admin.id,
      gameId: game.id,
      providerId: provider.id,
      providerServerId: "inst-123",
      status: "running",
    }).returning();
    serverId = server.id;
  });

  describe("POST /server-access/:serverId/:userId", () => {
    it("should allow admin to grant access", async () => {
      const res = await app.request(`/api/v1/server-access/${serverId}/${userId}`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.message).toBe("Access granted");
    });

    it("should deny normal user from granting access", async () => {
      const res = await app.request(`/api/v1/server-access/${serverId}/${userId}`, {
        method: "POST",
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /server-access/:serverId/:userId", () => {
    beforeEach(async () => {
      await testDb.insert(serverAccessTable).values({ serverId, userId });
    });

    it("should allow admin to revoke access", async () => {
      const res = await app.request(`/api/v1/server-access/${serverId}/${userId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.message).toBe("Access revoked");
    });

    it("should deny normal user from revoking access", async () => {
      const res = await app.request(`/api/v1/server-access/${serverId}/${userId}`, {
        method: "DELETE",
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /server-access/:serverId", () => {
    beforeEach(async () => {
      await testDb.insert(serverAccessTable).values({ serverId, userId });
    });

    it("should allow admin to list users with access", async () => {
      const res = await app.request(`/api/v1/server-access/${serverId}`, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(userId);
    });

    it("should deny normal user from listing users with access", async () => {
      const res = await app.request(`/api/v1/server-access/${serverId}`, {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });
});
