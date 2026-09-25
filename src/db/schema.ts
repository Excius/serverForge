import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const serverStatusEnum = pgEnum("server_status", [
  "starting",
  "running",
  "stopping",
  "stopped",
  "error",
  "unknown",
]);

export const userTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: userRoleEnum().notNull().default("user"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp(),
});

export const gameTable = pgTable("games", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp(),
});

export const providerTable = pgTable("providers", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp(),
});

export const serverTable = pgTable("servers", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdBy: uuid()
    .notNull()
    .references(() => userTable.id),
  providerId: uuid()
    .notNull()
    .references(() => providerTable.id),
  providerServerId: text().notNull(),
  gameId: uuid()
    .notNull()
    .references(() => gameTable.id),
  status: serverStatusEnum().notNull().default("unknown"),
  playerCount: integer().notNull().default(0),
  lastHeartbeatAt: timestamp(),
  lastPlayerActivityAt: timestamp(),
  lastStartedAt: timestamp(),
  lastStoppedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp(),
});

export const serverAccessTable = pgTable(
  "server_access",
  {
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    serverId: uuid()
      .notNull()
      .references(() => serverTable.id),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.serverId],
    }),
  ],
);

export const sessionTable = pgTable("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  tokenHash: text().notNull().unique(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  revokedAt: timestamp(),
});
