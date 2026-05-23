import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { teams } from './teams'

export const playbooks = pgTable('playbooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  isBuiltIn: boolean('is_built_in').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  shareToken: text('share_token').unique(),
  forkedFromId: uuid('forked_from_id'), // self-reference, no FK constraint to avoid complexity
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
