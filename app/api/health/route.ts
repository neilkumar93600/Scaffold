import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { sql } from 'drizzle-orm'

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {
    db: 'fail',
    env: 'fail',
    redis: 'fail',
  }

  // DB connectivity
  try {
    await db.execute(sql`SELECT 1`)
    checks.db = 'ok'
  } catch {
    // intentionally swallowed — degraded status returned below
  }

  // Required env vars present
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]
  if (required.every(key => !!process.env[key])) {
    checks.env = 'ok'
  }

  // Redis ping
  try {
    await redis.ping()
    checks.redis = 'ok'
  } catch {
    // intentionally swallowed
  }

  const status = Object.values(checks).every(v => v === 'ok') ? 'ok' : 'degraded'

  return NextResponse.json({ status, checks }, {
    status: status === 'ok' ? 200 : 503,
  })
}
