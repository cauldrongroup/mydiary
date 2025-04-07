import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(turso, { schema });

// Helper function to check if a user can edit an entry
export async function canEditEntry(userId: string, entryDate: string) {
  const today = new Date().toISOString().split('T')[0];
  return entryDate === today;
} 