import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { playbooks } from './playbooks'
import { stacks } from './stacks'

export const playbookRuns = pgTable('playbook_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  playbookId: uuid('playbook_id').notNull().references(() => playbooks.id, { onDelete: 'cascade' }),
  stackId: uuid('stack_id').references(() => stacks.id, { onDelete: 'set null' }),
  projectName: text('project_name').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'complete' | 'abandoned'
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
