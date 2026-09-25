import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "../../src/index";
import { clearDatabase, testDb } from "../setup/db";
import { userTable, providerTable, sessionTable } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/password";
import { hashSessionToken } from "../../src/lib/session";

vi.mock("../../src/db/index", () => ({
  getDb: () => testDb,
}));

describe("Provider Config API Routes", () => {
  let adminCookie = "";
  let userCookie = "";
  let providerId = "";

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

    const [provider] = await testDb
      .insert(providerTable)
      .values({
        name: "AWS Cloud",
        slug: "aws",
      })
      .returning();
    providerId = provider.id;
  });

  describe("GET /api/v1/providers/:id/config", () => {
    it("should allow admin to view provider config schema", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}/config`, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.slug).toBe("aws");
      expect(Array.isArray(body.fields)).toBe(true);
      expect(body.fields.length).toBe(3);
    });

    it("should deny normal user from accessing config", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}/config`, {
        headers: { Cookie: userCookie },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/v1/providers/:id/config", () => {
    it("should allow admin to save valid AWS config", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}/config`, {
        method: "PUT",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          values: {
            AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
            AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            AWS_REGION: "us-east-1",
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.slug).toBe("aws");

      const secretField = body.fields.find((f: any) => f.key === "AWS_SECRET_ACCESS_KEY");
      expect(secretField.value).toBeUndefined(); // NEVER returned
      expect(secretField.configured).toBe(true);
    });
  });

  describe("DELETE /api/v1/providers/:id/config", () => {
    it("should allow admin to delete provider config", async () => {
      const res = await app.request(`/api/v1/providers/${providerId}/config`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(200);
    });
  });
});
