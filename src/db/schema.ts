import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const diaryEntries = sqliteTable('diary_entries', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  // We'll store the date as YYYY-MM-DD format for easy querying
  entryDate: text('entry_date').notNull(),
  isEditable: integer('is_editable').notNull().default(1), // Using integer for boolean (1 = true, 0 = false)
});

export const streaks = sqliteTable("streaks", {
  id: integer("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastEntryDate: text("last_entry_date").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}); 