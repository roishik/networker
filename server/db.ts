import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      db = drizzle(sql, { schema });
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection failed:", error);
      return null;
    }
  }
  return db;
}

export async function testConnection() {
  const database = getDb();
  if (!database) return false;
  
  try {
    await database.select().from(schema.users).limit(1);
    return true;
  } catch (error) {
    console.error("Database test failed:", error);
    return false;
  }
}