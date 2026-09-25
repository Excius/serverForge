import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "../../src/index";
import { clearDatabase, testDb } from "../setup/db";
import { userTable } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../src/lib/password";

vi.mock("../../src/lib/config", () => ({
  env: {
    SESSION_DURATION: 3600,
    JWT_SECRET: "test-secret",
  },
}));

// Mock the db getter to return our testDb
vi.mock("../../src/db/index", () => ({
  getDb: () => testDb,
}));

describe("Auth Routes", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });
      
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.email).toBe("test@example.com");
      expect(body.role).toBe("user");
      expect(body).not.toHaveProperty("password");
      expect(body).not.toHaveProperty("passwordHash");
    });

    it("should fail with invalid email", async () => {
      const res = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "password123" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      const hash = await hashPassword("password123");
      await testDb.insert(userTable).values({
        email: "login@example.com",
        passwordHash: hash,
        role: "user",
      });
    });

    it("should login successfully and return session cookie", async () => {
      const res = await app.request("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "login@example.com", password: "password123" }),
      });
      
      expect(res.status).toBe(200);
      const cookies = res.headers.get("set-cookie");
      expect(cookies).toContain("session=");
    });

    it("should fail with incorrect password", async () => {
      const res = await app.request("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "login@example.com", password: "wrong" }),
      });
      
      expect(res.status).toBe(400);
    });
  });
});
