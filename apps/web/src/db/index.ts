import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: PostgresJsDatabase<typeof schema> | undefined;
};

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const client =
    globalForDb.conn ??
    postgres(connectionString, {
      prepare: false,
      ssl: connectionString.includes("sslmode=require") ? "require" : undefined,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = client;
  }

  const database = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.db = database;
  }

  return database;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
