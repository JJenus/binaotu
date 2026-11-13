import { createDb, type Db } from '../db/client'
import { runMigrations, type MigrationFile } from '../db/migrate'

async function loadMigrations(): Promise<MigrationFile[]> {
  const storage = useStorage('assets:migrations')
  const keys = (await storage.getKeys()).filter(k => k.endsWith('.sql'))
  return Promise.all(keys.map(async key => ({ name: key.split(':').pop()!, sql: String(await storage.getItem(key)) })))
}

let ready: Promise<Db> | undefined

/** Process-wide database, created and migrated on first use. */
export function useDb(): Promise<Db> {
  ready ??= (async () => {
    const { databaseUrl } = useRuntimeConfig()
    if (!databaseUrl && !import.meta.dev) console.warn('DATABASE_URL is not set: using embedded PGlite in .data/pglite. Set DATABASE_URL to a Postgres instance for real deployments.')
    const { db } = await createDb(databaseUrl || undefined, databaseUrl ? undefined : '.data/pglite')
    await runMigrations(db, await loadMigrations())
    return db
  })().catch((e) => { ready = undefined; throw e })
  return ready
}
