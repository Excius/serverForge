import { and, eq, isNull } from "drizzle-orm";
import { Database } from "../db";
import { gameTable } from "../db/schema";

export class GameRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(gameTable)
      .where(and(eq(gameTable.id, id), isNull(gameTable.deletedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async findBySlug(slug: string) {
    return this.db
      .select()
      .from(gameTable)
      .where(and(eq(gameTable.slug, slug), isNull(gameTable.deletedAt)))
      .limit(1);
  }

  async findAll() {
    return this.db.select().from(gameTable).where(isNull(gameTable.deletedAt));
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

  async softDelete(id: string) {
    const result = await this.db
      .update(gameTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(gameTable.id, id))
      .returning();

    return result[0] ?? null;
  }
}
