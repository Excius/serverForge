import { eq } from "drizzle-orm";
import { Database } from "../db";
import { userTable } from "../db/schema";

export class UserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async create(email: string, pass: string) {
    const result = await this.db
      .insert(userTable)
      .values({
        email,
        passwordHash: pass,
      })
      .returning();

    return result[0];
  }
}
