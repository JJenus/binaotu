import { afterAll, describe, expect, it } from 'vitest'
import { createTestDb } from '../db/testing'
import { KinshipError } from '../../shared/kinship'
import { register } from './auth.service'
import { addRelative, createFamily, getTree, relationship, removePerson, searchFamilies, updatePerson } from './family.service'
import { seedDemoFamily } from './demo.service'
import { AppError } from './errors'

const person = (givenName: string, extra = {}) => ({ givenName, sex: 'unknown' as const, ...extra })

describe('family service', async () => {
  const { db, close } = await createTestDb()
  afterAll(close)
  const owner = await register(db, { name: 'Owner', email: 'owner@example.com', password: 'password123' })
  const me = { userId: owner.id }
  const make = (name: string, founder = person('Ada'), visibility: 'public' | 'private' = 'public') => createFamily(db, { name, visibility, founder }, owner.id)

  it('creates a family with its founder, makes the creator owner, and gives duplicate names distinct slugs', async () => {
    const a = await make('Okoro', person('Ada', { familyName: 'Okoro', birthYear: 1970 }))
    const b = await make('Okoro')
    expect([a.family.slug, b.family.slug]).toEqual(['okoro', 'okoro-2'])
    expect(a.access).toEqual({ role: 'owner', canEdit: true, canManage: true })
    expect(a.persons).toMatchObject([{ givenName: 'Ada', birthYear: 1970, redacted: false }])
  })

  it('searches by family name, slug and the surname of a deceased member, and hides private families', async () => {
    await make('Hidden', person('Zed'), 'private')
    await make('The Tari line', person('Esther', { familyName: 'Nwosu', birthYear: 1890, deathYear: 1960 }))
    await make('Living only', person('Joy', { familyName: 'Secretname', birthYear: 1995 }))
    expect((await searchFamilies(db, 'okor')).map(f => f.slug).sort()).toEqual(['okoro', 'okoro-2'])
    expect((await searchFamilies(db, 'nwosu')).map(f => f.slug)).toEqual(['the-tari-line'])
    expect(await searchFamilies(db, 'secretname')).toEqual([])
    expect(await searchFamilies(db, 'hidden')).toEqual([])
    expect(await searchFamilies(db, '100%')).toEqual([])
  })

  it('adds a sibling to someone with no parents by creating a placeholder parent', async () => {
    const t = await make('Sibling test')
    const res = await addRelative(db, t.family.slug, t.persons[0]!.id, { relation: 'sibling', person: person('Bem') }, me)
    expect(res.tree.persons).toHaveLength(3)
    expect(res.tree.persons.filter(p => p.isPlaceholder)).toHaveLength(1)
    expect((await relationship(db, t.family.slug, t.persons[0]!.id, res.focusId, me)).label).toBe('Sibling')
  })

  it('writes nothing when a plan is rejected', async () => {
    const t = await make('Atomic')
    const ada = t.persons[0]!.id
    await addRelative(db, t.family.slug, ada, { relation: 'parent', person: person('Mum', { sex: 'female' }) }, me)
    await addRelative(db, t.family.slug, ada, { relation: 'parent', person: person('Dad', { sex: 'male' }) }, me)
    const before = await getTree(db, t.family.slug, me)
    await expect(addRelative(db, t.family.slug, ada, { relation: 'parent', person: person('Extra') }, me)).rejects.toMatchObject({ code: 'MAX_PARENTS' })
    expect(await getTree(db, t.family.slug, me)).toEqual(before)
    expect(before.unions).toHaveLength(1)
  })

  it('rejects unknown families, and people from another family', async () => {
    const x = await make('Family X', person('X1')), y = await make('Family Y', person('Y1'))
    await expect(getTree(db, 'nope', me)).rejects.toBeInstanceOf(AppError)
    await expect(addRelative(db, x.family.slug, y.persons[0]!.id, { relation: 'child', person: person('K') }, me)).rejects.toBeInstanceOf(KinshipError)
  })

  it('edits a person and turns a placeholder into a real person', async () => {
    const t = await make('Edit test')
    const res = await addRelative(db, t.family.slug, t.persons[0]!.id, { relation: 'sibling', person: person('Bem') }, me)
    const placeholder = res.tree.persons.find(p => p.isPlaceholder)!
    const edited = await updatePerson(db, t.family.slug, placeholder.id, person('Mama', { sex: 'female', birthYear: 1950, birthPlace: 'Yenagoa', notes: 'Matriarch' }), me)
    expect(edited.persons.find(p => p.id === placeholder.id)).toMatchObject({ givenName: 'Mama', birthPlace: 'Yenagoa', isPlaceholder: false })
    await expect(updatePerson(db, t.family.slug, '00000000-0000-4000-8000-000000000000', person('X'), me)).rejects.toBeInstanceOf(KinshipError)
  })

  it('removes a leaf, clears orphaned placeholders, and keeps the rest connected', async () => {
    const t = await make('Remove test')
    const { focusId: bem } = await addRelative(db, t.family.slug, t.persons[0]!.id, { relation: 'sibling', person: person('Bem') }, me)
    const afterBem = await removePerson(db, t.family.slug, bem, me)
    expect(afterBem.persons.map(p => p.givenName).sort()).toEqual(['Ada', 'Unknown'])
    await expect(removePerson(db, t.family.slug, afterBem.persons.find(p => p.isPlaceholder)!.id, me)).resolves.toMatchObject({ persons: [{ givenName: 'Ada' }] })
  })

  it('refuses to remove someone whose removal would strand people, or the last person', async () => {
    const t = await make('Guard test')
    const ada = t.persons[0]!.id
    const { focusId: kid } = await addRelative(db, t.family.slug, ada, { relation: 'child', person: person('Kid') }, me)
    const { focusId: grandkid } = await addRelative(db, t.family.slug, kid, { relation: 'child', person: person('Grandkid') }, me)
    await expect(removePerson(db, t.family.slug, kid, me)).rejects.toMatchObject({ status: 409 })
    await removePerson(db, t.family.slug, grandkid, me)
    await removePerson(db, t.family.slug, kid, me)
    await expect(removePerson(db, t.family.slug, ada, me)).rejects.toMatchObject({ status: 409, message: 'A family needs at least one person' })
  })

  it('works end to end on the sample family, seen by its owner', async () => {
    await seedDemoFamily(db, owner.id)
    const tree = await getTree(db, 'ebi', me)
    expect(tree.persons).toHaveLength(24)
    const byName = (n: string) => tree.persons.find(p => p.givenName === n)!.id
    expect((await relationship(db, 'ebi', byName('Ebiere'), byName('Wale'), me)).label).toBe('First cousin')
    expect((await relationship(db, 'ebi', byName('Ebiere'), byName('Ayo'), me)).label).toBe('First cousin, once removed')
    const added = await addRelative(db, 'ebi', byName('Ebiere'), { relation: 'cousin', viaAuncleId: byName('Ruth'), person: person('Nene', { sex: 'female' }) }, me)
    expect((await relationship(db, 'ebi', byName('Ebiere'), added.focusId, me)).label).toBe('First cousin')
    expect((await searchFamilies(db, 'ebi'))[0]).toMatchObject({ slug: 'ebi', personCount: 25, minYear: 1936 })
  })
})
