import { and, eq } from "drizzle-orm";
import type { Database } from "../db";
import {
  gameTable,
  providerTable,
  serverAccessTable,
  serverTable,
} from "../db/schema";

export class ServerRepository {
  constructor(private readonly db: Database) {}

  async findAll() {
    const rows = await this.db
      .select({
        server: serverTable,
        gameSlug: gameTable.slug,
        providerSlug: providerTable.slug,
      })
      .from(serverTable)
      .leftJoin(gameTable, eq(serverTable.gameId, gameTable.id))
      .leftJoin(providerTable, eq(serverTable.providerId, providerTable.id));

    return rows.map((r) => ({
      ...r.server,
      gameSlug: r.gameSlug ?? undefined,
      providerSlug: r.providerSlug ?? undefined,
      currentPlayers: r.server.playerCount,
    }));
  }

  async findForUser(userId: string) {
    const rows = await this.db
      .select({
        server: serverTable,
        gameSlug: gameTable.slug,
        providerSlug: providerTable.slug,
      })
      .from(serverTable)
      .innerJoin(
        serverAccessTable,
        eq(serverTable.id, serverAccessTable.serverId),
      )
      .leftJoin(gameTable, eq(serverTable.gameId, gameTable.id))
      .leftJoin(providerTable, eq(serverTable.providerId, providerTable.id))
      .where(eq(serverAccessTable.userId, userId));

    return rows.map((r) => ({
      ...r.server,
      gameSlug: r.gameSlug ?? undefined,
      providerSlug: r.providerSlug ?? undefined,
      currentPlayers: r.server.playerCount,
    }));
  }

  async findById(id: string) {
    const rows = await this.db
      .select({
        server: serverTable,
        gameSlug: gameTable.slug,
        providerSlug: providerTable.slug,
      })
      .from(serverTable)
      .leftJoin(gameTable, eq(serverTable.gameId, gameTable.id))
      .leftJoin(providerTable, eq(serverTable.providerId, providerTable.id))
      .where(eq(serverTable.id, id))
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    return {
      ...r.server,
      gameSlug: r.gameSlug ?? undefined,
      providerSlug: r.providerSlug ?? undefined,
      currentPlayers: r.server.playerCount,
    };
  }

  async findByProviderServerId(providerId: string, providerServerId: string) {
    const result = await this.db
      .select()
      .from(serverTable)
      .where(
        and(
          eq(serverTable.providerId, providerId),
          eq(serverTable.providerServerId, providerServerId),
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

  async delete(id: string) {
    await this.db
      .delete(serverAccessTable)
      .where(eq(serverAccessTable.serverId, id));

    const result = await this.db
      .delete(serverTable)
      .where(eq(serverTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  async findActiveByGameId(gameId: string) {
    return this.db
      .select()
      .from(serverTable)
      .where(eq(serverTable.gameId, gameId))
      .limit(1);
  }

  async findActiveByProviderId(providerId: string) {
    return this.db
      .select()
      .from(serverTable)
      .where(eq(serverTable.providerId, providerId))
      .limit(1);
  }

  async findServersForReconciliation() {
    return this.db.select().from(serverTable);
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
