import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "../../src/index";
import { clearDatabase, testDb } from "../setup/db";
import { userTable, providerTable, sessionTable } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/password";
import { hashSessionToken } from "../../src/lib/session";

vi.mock("../../src/db/index", () => ({
  getDb: () => testDb,
}));

describe("Providers Routes", () => {
  let adminCookie = "";
  let userCookie = "";
  let providerId = "";

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

    const [provider] = await testDb.insert(providerTable).values({
      name: "AWS EC2",
      slug: "aws",
    }).returning();
    providerId = provider.id;
  });

  describe("GET /providers", () => {
    it("should deny listing providerTable without auth", async () => {
      const res = await app.request("/api/v1/providers");
      expect(res.status).toBe(401);
    });

    it("should allow listing providerTable with auth", async () => {
      const res = await app.request("/api/v1/providers", {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
    });
  });

  describe("POST /providers", () => {
    it("should allow admin to create a provider", async () => {
      const res = await app.request("/api/v1/providers", {
        method: "POST",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mock", slug: "mock" }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.name).toBe("Mock");
    });

    it("should deny normal user from creating a provider", async () => {
      const res = await app.request("/api/v1/providers", {
        method: "POST",
        headers: { Cookie: userCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Azure", slug: "azure" }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /providers/:id", () => {
    it("should return the provider for valid id", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.id).toBe(providerId);
    });
    
    it("should return 400 for malformed UUID", async () => {
      const res = await app.request("/api/v1/providers/not-a-uuid");
      expect(res.status).toBe(400);
    });
    
    it("should return 404 for nonexistent provider", async () => {
      const res = await app.request("/api/v1/providers/00000000-0000-0000-0000-000000000000");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /providers/:id", () => {
    it("should allow admin to update provider", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}`, {
        method: "PATCH",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "AWS Pro" }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.name).toBe("AWS Pro");
    });

    it("should deny normal user from updating provider", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}`, {
        method: "PATCH",
        headers: { Cookie: userCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacked" }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /providers/:id", () => {
    it("should allow admin to delete provider", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      
      const getRes = await app.request(`/api/v1/providers/${providerId}`);
      expect(getRes.status).toBe(404);
    });

    it("should deny normal user from deleting provider", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}`, {
        method: "DELETE",
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });
});
