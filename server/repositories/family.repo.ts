import { and, asc, eq, ilike, like, or, sql } from 'drizzle-orm'
import type { Db } from '../db/client'
import { families, persons } from '../db/schema'
import type { FamilyDTO, FamilySummaryDTO, Visibility } from '../../shared/types'

const familyColumns = { id: families.id, slug: families.slug, name: families.name, description: families.description, visibility: families.visibility }
// Drizzle prints single-table columns unqualified, which would resolve to the subquery’s own table. Qualify explicitly.
const familyId = sql.raw('"family"."id"')
const escapeLike = (s: string) => s.replace(/[\\%_]/g, m => `\\${m}`)

export async function findBySlug(db: Db, slug: string): Promise<FamilyDTO | undefined> {
  const [row] = await db.select(familyColumns).from(families).where(eq(families.slug, slug)).limit(1)
  return row
}

/** Public families whose name, slug or any member’s surname matches `q`. An empty query lists the newest. */
export async function searchPublic(db: Db, q: string, limit = 30): Promise<FamilySummaryDTO[]> {
  const pattern = `%${escapeLike(q)}%`
  const matches = q
    ? or(
        ilike(families.name, pattern),
        ilike(families.slug, pattern),
        sql`exists (select 1 from person m where m.family_id = ${familyId} and m.family_name ilike ${pattern})`
      )
    : undefined
  return db.select({
    ...familyColumns,
    personCount: sql<number>`(select count(*)::int from person m where m.family_id = ${familyId} and not m.is_placeholder)`,
    minYear: sql<number | null>`(select min(m.birth_year) from person m where m.family_id = ${familyId})`,
    maxYear: sql<number | null>`(select max(coalesce(m.death_year, m.birth_year)) from person m where m.family_id = ${familyId})`
  }).from(families).where(and(eq(families.visibility, 'public'), matches)).orderBy(q ? asc(families.name) : sql`${families.createdAt} desc`).limit(limit)
}

export async function slugsStartingWith(db: Db, base: string): Promise<string[]> {
  const rows = await db.select({ slug: families.slug }).from(families).where(or(eq(families.slug, base), like(families.slug, `${escapeLike(base)}-%`)))
  return rows.map(r => r.slug)
}

export async function insertFamily(db: Db, v: { slug: string, name: string, description?: string | null, visibility: Visibility }): Promise<FamilyDTO> {
  const [row] = await db.insert(families).values({ ...v, description: v.description ?? null }).returning(familyColumns)
  return row!
}

export async function countFamilies(db: Db): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(families)
  return row!.n
}

export { persons }
