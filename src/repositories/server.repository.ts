import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "../db";
import { serverTable } from "../db/schema";

export class ServerRepository {
  constructor(private readonly db: Database) {}

  async findAll() {
    return this.db
      .select()
      .from(serverTable)
      .where(isNull(serverTable.deletedAt));
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(serverTable)
      .where(and(eq(serverTable.id, id), isNull(serverTable.deletedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async findByProviderServerId(providerId: string, providerServerId: string) {
    const result = await this.db
      .select()
      .from(serverTable)
      .where(
        and(
          eq(serverTable.providerId, providerId),
          eq(serverTable.providerServerId, providerServerId),
          isNull(serverTable.deletedAt),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async create(data: {
    name: string;
    createdBy: string;
    providerId: string;
    providerServerId: string;
    gameId: string;
    status: "unknown";
  }) {
    const result = await this.db.insert(serverTable).values(data).returning();

    return result[0];
  }

  async update(
    id: string,
    data: {
      name?: string;
      status?:
        "starting" | "running" | "stopping" | "stopped" | "error" | "unknown";
      lastStoppedAt?: Date;
    },
  ) {
    const result = await this.db
      .update(serverTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(serverTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  async softDelete(id: string) {
    const result = await this.db
      .update(serverTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serverTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  async findServersForReconciliation() {
    return this.db
      .select()
      .from(serverTable)
      .where(isNull(serverTable.deletedAt));
  }

  async updateHealth(
    id: string,
    data: {
      playerCount: number;
      lastHeartbeatAt: Date;
      lastPlayerActivityAt?: Date;
    },
  ) {
    const updateData: {
      playerCount: number;
      lastHeartbeatAt: Date;
      lastPlayerActivityAt?: Date;
      updatedAt: Date;
    } = {
      playerCount: data.playerCount,
      lastHeartbeatAt: data.lastHeartbeatAt,
      updatedAt: new Date(),
    };

    if (data.lastPlayerActivityAt) {
      updateData.lastPlayerActivityAt = data.lastPlayerActivityAt;
    }

    const result = await this.db
      .update(serverTable)
      .set(updateData)
      .where(eq(serverTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  async claimForStopping(id: string) {
    const result = await this.db
      .update(serverTable)
      .set({
        status: "stopping",
        updatedAt: new Date(),
      })
      .where(and(eq(serverTable.id, id), eq(serverTable.status, "running")))
      .returning({
        id: serverTable.id,
      });

    return result[0] ?? null;
  }
}
