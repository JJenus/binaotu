import { afterAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDb, readMigrationsFromDisk } from './testing'
import { runMigrations } from './migrate'
import { families, parentLinks, persons } from './schema'

describe('database', async () => {
  const { db, close } = await createTestDb()
  afterAll(close)

  it('does not reapply migrations', async () => {
    expect(await runMigrations(db, readMigrationsFromDisk())).toEqual([])
  })

  it('stores a family with people and cascades on delete', async () => {
    const [fam] = await db.insert(families).values({ slug: 'ebi', name: 'Ebi' }).returning()
    const [a, b] = await db.insert(persons).values([
      { familyId: fam!.id, givenName: 'Daniel' },
      { familyId: fam!.id, givenName: 'Ebiere', sex: 'female' }
    ]).returning()
    await db.insert(parentLinks).values({ childId: b!.id, parentId: a!.id })
    expect((await db.select().from(parentLinks)).length).toBe(1)
    await db.delete(families).where(eq(families.id, fam!.id))
    expect((await db.select().from(persons)).length).toBe(0)
    expect((await db.select().from(parentLinks)).length).toBe(0)
  })
})
