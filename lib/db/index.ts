import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// CRITICAL: prepare: false required for Supabase transaction pool mode (PgBouncer)
// Without this, prepared statements fail in serverless environments
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

// RLS policies: apply lib/db/migrations/0001_rls.sql via Supabase SQL editor or psql after db:push
export const db = drizzle({ client, schema })
