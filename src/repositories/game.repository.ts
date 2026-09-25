import { eq } from "drizzle-orm";
import { Database } from "../db";
import { gameTable } from "../db/schema";

export class GameRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(gameTable)
      .where(eq(gameTable.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findBySlug(slug: string) {
    return this.db
      .select()
      .from(gameTable)
      .where(eq(gameTable.slug, slug))
      .limit(1);
  }

  async findAll() {
    return this.db.select().from(gameTable);
  }

  async create(name: string, slug: string) {
    const result = await this.db
      .insert(gameTable)
      .values({
        name,
        slug,
      })
      .returning();

    return result[0] ?? null;
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
    },
  ) {
    const result = await this.db
      .update(gameTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(gameTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string) {
    const result = await this.db
      .delete(gameTable)
      .where(eq(gameTable.id, id))
      .returning();

    return result[0] ?? null;
  }
}
