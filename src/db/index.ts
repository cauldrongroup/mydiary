import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(turso, { schema });

/**
 * Determines whether the user is allowed to edit an entry based solely on the entry date.
 *
 * The function compares the provided entry date with today's date (formatted as "YYYY-MM-DD"). Although the userId parameter
 * is included, it is not used in the current logic.
 *
 * @param userId - The identifier of the user (reserved for potential future use).
 * @param entryDate - The entry's date as a string in the "YYYY-MM-DD" format.
 * @returns A promise that resolves to true if the provided entry date matches today's date; otherwise, false.
 */
export async function canEditEntry(userId: string, entryDate: string) {
  const today = new Date().toISOString().split('T')[0];
  return entryDate === today;
} 