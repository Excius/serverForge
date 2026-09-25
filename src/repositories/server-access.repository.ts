import { and, eq } from "drizzle-orm";
import { serverAccessTable, userTable } from "../db/schema";
import { Database } from "../db";

export class ServerAccessRepository {
  constructor(private db: Database) {}

  async grantAccess(serverId: string, userId: string) {
    const [result] = await this.db
      .insert(serverAccessTable)
      .values({ serverId, userId })
      .onConflictDoNothing()
      .returning();

    return result || { serverId, userId };
  }

  async revokeAccess(serverId: string, userId: string) {
    const [result] = await this.db
      .delete(serverAccessTable)
      .where(
        and(
          eq(serverAccessTable.serverId, serverId),
          eq(serverAccessTable.userId, userId),
        ),
      )
      .returning();

    return result || null;
  }

  async hasAccess(serverId: string, userId: string) {
    const [result] = await this.db
      .select()
      .from(serverAccessTable)
      .where(
        and(
          eq(serverAccessTable.serverId, serverId),
          eq(serverAccessTable.userId, userId),
        ),
      )
      .limit(1);

    return !!result;
  }

  async getUsersForServer(serverId: string) {
    const result = await this.db
      .select({
        id: userTable.id,
        email: userTable.email,
        role: userTable.role,
      })
      .from(serverAccessTable)
      .innerJoin(userTable, eq(serverAccessTable.userId, userTable.id))
      .where(eq(serverAccessTable.serverId, serverId));

    return result;
  }
}
