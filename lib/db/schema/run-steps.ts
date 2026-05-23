import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core'
import { playbookRuns } from './playbook-runs'
import { playbookSteps } from './playbook-steps'

export const runSteps = pgTable('run_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => playbookRuns.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id').notNull().references(() => playbookSteps.id, { onDelete: 'cascade' }),
  isComplete: boolean('is_complete').notNull().default(false),
  autoCompleted: boolean('auto_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
