import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "../../src/index";
import { clearDatabase, testDb } from "../setup/db";
import { userTable, gameTable, sessionTable } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/password";
import { hashSessionToken } from "../../src/lib/session";

vi.mock("../../src/db/index", () => ({
  getDb: () => testDb,
}));

describe("Games Routes", () => {
  let adminCookie = "";
  let userCookie = "";
  let gameId = "";

  beforeEach(async () => {
    await clearDatabase();
    
    const adminHash = await hashPassword("password123");
    const [adminUser] = await testDb.insert(userTable).values({
      email: "admin@example.com",
      passwordHash: adminHash,
      role: "admin",
    }).returning();
    
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
  });

  describe("GET /games", () => {
    it("should allow authenticated userTable to list gameTable", async () => {
      const res = await app.request("/api/v1/games", {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
    });

    it("should deny unauthenticated userTable", async () => {
      const res = await app.request("/api/v1/games");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /games", () => {
    it("should allow admin to create a game", async () => {
      const res = await app.request("/api/v1/games", {
        method: "POST",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Palworld", slug: "palworld" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("Palworld");
    });

    it("should deny normal user from creating a game", async () => {
      const res = await app.request("/api/v1/games", {
        method: "POST",
        headers: { Cookie: userCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Rust", slug: "rust" }),
      });
      expect(res.status).toBe(403);
    });
    
    it("should return 400 for invalid data", async () => {
      const res = await app.request("/api/v1/games", {
        method: "POST",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Rust" }), // missing slug
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /games/:id", () => {
    it("should return the game for valid id", async () => {
      const res = await app.request(`/api/v1/games/${gameId}`, {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(gameId);
    });
    
    it("should return 400 for malformed UUID", async () => {
      const res = await app.request("/api/v1/games/not-a-uuid", {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(400);
    });
    
    it("should return 404 for nonexistent game", async () => {
      const res = await app.request("/api/v1/games/00000000-0000-0000-0000-000000000000", {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /games/:id", () => {
    it("should allow admin to update game", async () => {
      const res = await app.request(`/api/v1/games/${gameId}`, {
        method: "PATCH",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Minecraft 2" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("Minecraft 2");
    });

    it("should deny normal user from updating game", async () => {
      const res = await app.request(`/api/v1/games/${gameId}`, {
        method: "PATCH",
        headers: { Cookie: userCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacked" }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /games/:id", () => {
    it("should allow admin to delete game", async () => {
      const res = await app.request(`/api/v1/games/${gameId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      
      const getRes = await app.request(`/api/v1/games/${gameId}`, {
        headers: { Cookie: userCookie },
      });
      expect(getRes.status).toBe(404); // Should be soft deleted or deleted
    });

    it("should deny normal user from deleting game", async () => {
      const res = await app.request(`/api/v1/games/${gameId}`, {
        method: "DELETE",
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });
});
