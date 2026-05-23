import { pgTable, uuid, text, boolean, jsonb, integer, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { teams } from './teams'

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  category: text('category').notNull(),
  // tags: string[]
  tags: jsonb('tags').notNull().default([]),
  // stackCompat: string[] of toolIds
  stackCompat: jsonb('stack_compat').notNull().default([]),
  // plain text only — never render as HTML
  content: text('content').notNull(),
  version: integer('version').notNull().default(1),
  isPublic: boolean('is_public').notNull().default(false),
  isStale: boolean('is_stale').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
