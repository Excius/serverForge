import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "../db";
import { providerTable } from "../db/schema";

export class ProviderRepository {
  constructor(private readonly db: Database) {}

  async findAll() {
    return this.db
      .select()
      .from(providerTable)
      .where(isNull(providerTable.deletedAt));
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(providerTable)
      .where(and(eq(providerTable.id, id), isNull(providerTable.deletedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async findBySlug(slug: string) {
    const result = await this.db
      .select()
      .from(providerTable)
      .where(and(eq(providerTable.slug, slug), isNull(providerTable.deletedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async create(name: string, slug: string) {
    const result = await this.db
      .insert(providerTable)
      .values({
        name,
        slug,
      })
      .returning();

    return result[0];
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
    },
  ) {
    const result = await this.db
      .update(providerTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(providerTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  async softDelete(id: string) {
    const result = await this.db
      .update(providerTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(providerTable.id, id))
      .returning();

    return result[0] ?? null;
  }
}
