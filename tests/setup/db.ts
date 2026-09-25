import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, vi } from "vitest";

vi.mock("argon2-wasm-edge", () => {
  return {
    setWASMModules: vi.fn(),
    default: {
      hash: vi.fn().mockResolvedValue(new Uint8Array([1,2,3])),
      verify: vi.fn().mockResolvedValue(true)
    }
  }
});

vi.mock("../../src/lib/password", () => ({
  hashPassword: vi.fn().mockImplementation(async (pw) => `hash-${pw}`),
  verifyPassword: vi.fn().mockImplementation(async (pw, hash) => hash === `hash-${pw}`)
}));

vi.mock("../../src/lib/session", () => ({
  generateSessionToken: vi.fn().mockReturnValue("mock-token-123"),
  hashSessionToken: vi.fn().mockImplementation(async (token) => `hash-${token}`)
}));

import { testDb } from "./db";
vi.mock("../../src/db/index", () => ({
  getDb: () => testDb
}));

vi.mock("../../src/lib/config", () => ({
  env: {
    DATABASE_URL: "postgres://mock",
    SESSION_DURATION: 3600,
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "mock",
    AWS_SECRET_ACCESS_KEY: "mock"
  }
}));

export let pgClient: PGlite;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let testDb: any;

beforeAll(async () => {
  // Use in-memory PGlite for tests, avoiding the need for Docker
  pgClient = new PGlite();
  
  testDb = drizzle(pgClient);

  // Run migrations
  await migrate(testDb, { migrationsFolder: "./drizzle" });
});

afterAll(async () => {
  if (pgClient) {
    await pgClient.close();
  }
});

// Helper to wipe tables between tests
export async function clearDatabase() {
  if (!pgClient) return;
  const tables = ["users", "providers", "games", "servers", "server_access", "sessions"];
  for (const table of tables) {
    try {
      await pgClient.query(`TRUNCATE TABLE ${table} CASCADE;`);
    } catch (e) {
      // Ignore errors if table doesn't exist yet
    }
  }
}
