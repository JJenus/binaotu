import { sql } from 'drizzle-orm'
import type { Db } from './client'

export interface MigrationFile {
  name: string
  sql: string
}

/** Applies each pending migration once, in name order, tracked in `_migrations`. Works on any Postgres driver. */
export async function runMigrations(db: Db, files: MigrationFile[]): Promise<string[]> {
  await db.execute(sql`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`)
  const res: any = await db.execute(sql`select name from _migrations`)
  const done = new Set<string>((res.rows ?? res).map((r: { name: string }) => r.name))
  const applied: string[] = []
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    if (done.has(file.name)) continue
    await db.transaction(async (tx) => {
      for (const statement of file.sql.split('--> statement-breakpoint')) {
        if (statement.trim()) await tx.execute(sql.raw(statement))
      }
      await tx.execute(sql`insert into _migrations (name) values (${file.name})`)
    })
    applied.push(file.name)
  }
  return applied
}
