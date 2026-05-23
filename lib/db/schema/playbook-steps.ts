import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { playbooks } from './playbooks'

export const playbookSteps = pgTable('playbook_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  playbookId: uuid('playbook_id').notNull().references(() => playbooks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  // autoCompleteFor: string[] of toolIds — step auto-completes if these tools are in the stack
  autoCompleteFor: jsonb('auto_complete_for').notNull().default([]),
  isRequired: boolean('is_required').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
