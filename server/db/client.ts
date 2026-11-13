import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from './schema'

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

export interface DbHandle {
  db: Db
  close: () => Promise<void>
}

/**
 * Real Postgres when a URL is given, otherwise in-process PGlite
 * (persisted to `dataDir` when provided, in-memory when not).
 */
export async function createDb(url?: string, dataDir?: string): Promise<DbHandle> {
  if (url) {
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const pg = await import('pg')
    const Pool = pg.Pool ?? (pg as any).default.Pool
    const pool = new Pool({ connectionString: url })
    return { db: drizzle(pool, { schema }) as unknown as Db, close: () => pool.end() }
  }
  const { drizzle } = await import('drizzle-orm/pglite')
  const { PGlite } = await import('@electric-sql/pglite')
  const client = new PGlite(dataDir)
  return { db: drizzle(client, { schema }) as unknown as Db, close: () => client.close() }
}
