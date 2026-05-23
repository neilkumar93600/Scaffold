import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// CRITICAL: prepare: false required for Supabase transaction pool mode (PgBouncer)
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

export const db = drizzle({ client })
