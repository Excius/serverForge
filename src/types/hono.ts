import { InferSelectModel } from "drizzle-orm";
import { Database } from "../db";
import { Bindings } from "../lib/config";
import { userTable } from "../db/schema";

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    db: Database;
    user: InferSelectModel<typeof userTable>;
  };
};
