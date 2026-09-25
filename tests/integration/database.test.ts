import { describe, it, expect, beforeEach } from "vitest";
import { testDb, clearDatabase } from "../setup/db";
import { userTable } from "../../src/db/schema";

describe("Database Connection", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("should be able to execute queries against the test database", async () => {
    const res = await testDb.select().from(userTable).limit(1);
    expect(res).toBeDefined();
    expect(Array.isArray(res)).toBe(true);
  });
});
