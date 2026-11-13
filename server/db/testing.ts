import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createDb } from './client'
import { runMigrations, type MigrationFile } from './migrate'

const dir = fileURLToPath(new URL('./migrations', import.meta.url))

export function readMigrationsFromDisk(): MigrationFile[] {
  return readdirSync(dir).filter(f => f.endsWith('.sql')).map(name => ({ name, sql: readFileSync(join(dir, name), 'utf8') }))
}

/** Fresh in-memory Postgres with all migrations applied. For tests. */
export async function createTestDb() {
  const handle = await createDb()
  await runMigrations(handle.db, readMigrationsFromDisk())
  return handle
}
