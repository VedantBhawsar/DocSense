/// <reference types="node" />
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.js";
import "dotenv/config"
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
