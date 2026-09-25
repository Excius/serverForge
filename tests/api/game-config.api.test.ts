import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "../../src/index";
import { clearDatabase, testDb } from "../setup/db";
import { userTable, gameTable, sessionTable } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/password";
import { hashSessionToken } from "../../src/lib/session";

vi.mock("../../src/db/index", () => ({
  getDb: () => testDb,
}));

describe("Game Config API Routes", () => {
  let adminCookie = "";
  let userCookie = "";
  let gameId = "";

  beforeEach(async () => {
    await clearDatabase();

    const adminHash = await hashPassword("password123");
    const [adminUser] = await testDb
      .insert(userTable)
      .values({
        email: "admin@example.com",
        passwordHash: adminHash,
        role: "admin",
      })
      .returning();

    const userHash = await hashPassword("password123");
    const [normalUser] = await testDb
      .insert(userTable)
      .values({
        email: "user@example.com",
        passwordHash: userHash,
        role: "user",
      })
      .returning();

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

    const [game] = await testDb
      .insert(gameTable)
      .values({
        name: "Palworld",
        slug: "palworld",
      })
      .returning();
    gameId = game.id;
  });

  describe("GET /api/v1/games/:id/config", () => {
    it("should allow admin to view game config schema and status", async () => {
      const res = await app.request(`/api/v1/games/${gameId}/config`, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.slug).toBe("palworld");
      expect(Array.isArray(body.fields)).toBe(true);
      expect(body.fields.length).toBe(3);
    });

    it("should deny normal user from accessing config", async () => {
      const res = await app.request(`/api/v1/games/${gameId}/config`, {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/v1/games/:id/config", () => {
    it("should allow admin to save valid config and omit plaintext secrets in response", async () => {
      const res = await app.request(`/api/v1/games/${gameId}/config`, {
        method: "PUT",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          values: {
            PALWORLD_API_URL: "http://10.0.0.10:8212",
            PALWORLD_API_USERNAME: "admin",
            PALWORLD_API_PASSWORD: "secret-pass",
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.slug).toBe("palworld");

      const passField = body.fields.find((f: any) => f.key === "PALWORLD_API_PASSWORD");
      expect(passField.value).toBeUndefined(); // NEVER returned
      expect(passField.configured).toBe(true);
    });

    it("should reject invalid URLs or missing required fields", async () => {
      const res = await app.request(`/api/v1/games/${gameId}/config`, {
        method: "PUT",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          values: {
            PALWORLD_API_URL: "invalid-url",
            PALWORLD_API_USERNAME: "admin",
            PALWORLD_API_PASSWORD: "secret-pass",
          },
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/games/:id/config", () => {
    it("should allow admin to delete game config", async () => {
      const res = await app.request(`/api/v1/games/${gameId}/config`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
    });
  });
});
