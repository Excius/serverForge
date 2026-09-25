import { eq } from "drizzle-orm";
import { Database } from "../db";
import { sessionTable } from "../db/schema";

export class SessionRepository {
  constructor(private readonly db: Database) {}

  async create(userId: string, tokenHash: string, expiresAt: Date) {
    const result = await this.db
      .insert(sessionTable)
      .values({
        userId,
        tokenHash,
        expiresAt,
      })
      .returning();

    return result[0];
  }

  async findByTokenHash(tokenHash: string) {
    const result = await this.db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.tokenHash, tokenHash))
      .limit(1);

    return result[0] ?? null;
  }

  async revokeById(id: string) {
    const result = await this.db
      .update(sessionTable)
      .set({ revokedAt: new Date() })
      .where(eq(sessionTable.id, id))
      .returning();

    return result[0] ?? null;
  }
}
