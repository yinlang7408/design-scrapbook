import { pgTable, uuid, text, integer, timestamp, date, unique } from 'drizzle-orm/pg-core';

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  date: date('date').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull().default('image/jpeg'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const terms = pgTable('terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  termEn: text('term_en').notNull(),
  termZh: text('term_zh').notNull(),
  position: integer('position').notNull().default(0),
});

export const dailyUsage = pgTable('daily_usage', {
  date: date('date').primaryKey(),
  costCents: integer('cost_cents').notNull().default(0),
  callCount: integer('call_count').notNull().default(0),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  date: date('date').notNull(),
  content: text('content').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [unique('notes_user_date_unique').on(t.userId, t.date)]);

export type Image = typeof images.$inferSelect;
export type Term = typeof terms.$inferSelect;
export type Note = typeof notes.$inferSelect;
