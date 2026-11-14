import { afterAll, describe, expect, it } from 'vitest'
import { createTestDb } from '../db/testing'
import { KinshipError } from '../../shared/kinship'
import { addRelative, createFamily, getTree, relationship, removePerson, searchFamilies, updatePerson } from './family.service'
import { seedDemoFamily } from './demo.service'
import { AppError } from './errors'

const person = (givenName: string, extra = {}) => ({ givenName, sex: 'unknown' as const, ...extra })

describe('family service', async () => {
  const { db, close } = await createTestDb()
  afterAll(close)

  it('creates a family with its founder and gives duplicate names distinct slugs', async () => {
    const a = await createFamily(db, { name: 'Okoro', visibility: 'public', founder: person('Ada', { familyName: 'Okoro', birthYear: 1970 }) })
    const b = await createFamily(db, { name: 'Okoro', visibility: 'public', founder: person('Bem') })
    expect([a.family.slug, b.family.slug]).toEqual(['okoro', 'okoro-2'])
    expect(a.persons).toMatchObject([{ givenName: 'Ada', birthYear: 1970 }])
  })

  it('searches by family name, slug and member surname, and hides private families', async () => {
    await createFamily(db, { name: 'Hidden', visibility: 'private', founder: person('Zed') })
    await createFamily(db, { name: 'The Tari line', visibility: 'public', founder: person('Esther', { familyName: 'Nwosu' }) })
    expect((await searchFamilies(db, 'okor')).map(f => f.slug).sort()).toEqual(['okoro', 'okoro-2'])
    expect((await searchFamilies(db, 'nwosu')).map(f => f.slug)).toEqual(['the-tari-line'])
    expect(await searchFamilies(db, 'hidden')).toEqual([])
    expect(await searchFamilies(db, '100%')).toEqual([])
  })

  it('adds a sibling to someone with no parents by creating a placeholder parent', async () => {
    const t = await createFamily(db, { name: 'Sibling test', visibility: 'public', founder: person('Ada') })
    const ada = t.persons[0]!
    const res = await addRelative(db, t.family.slug, ada.id, { relation: 'sibling', person: person('Bem') })
    expect(res.tree.persons).toHaveLength(3)
    expect(res.tree.persons.filter(p => p.isPlaceholder)).toHaveLength(1)
    expect(res.tree.parentLinks).toHaveLength(2)
    expect((await relationship(db, t.family.slug, ada.id, res.focusId)).label).toBe('Sibling')
  })

  it('writes nothing when a plan is rejected', async () => {
    const t = await createFamily(db, { name: 'Atomic', visibility: 'public', founder: person('Ada') })
    const ada = t.persons[0]!
    await addRelative(db, t.family.slug, ada.id, { relation: 'parent', person: person('Mum', { sex: 'female' }) })
    await addRelative(db, t.family.slug, ada.id, { relation: 'parent', person: person('Dad', { sex: 'male' }) })
    const before = await getTree(db, t.family.slug)
    await expect(addRelative(db, t.family.slug, ada.id, { relation: 'parent', person: person('Extra') })).rejects.toMatchObject({ code: 'MAX_PARENTS' })
    expect(await getTree(db, t.family.slug)).toEqual(before)
    expect(before.unions).toHaveLength(1)
  })

  it('rejects unknown families, unknown people and people from another family', async () => {
    const x = await createFamily(db, { name: 'Family X', visibility: 'public', founder: person('X1') })
    const y = await createFamily(db, { name: 'Family Y', visibility: 'public', founder: person('Y1') })
    await expect(getTree(db, 'nope')).rejects.toBeInstanceOf(AppError)
    await expect(addRelative(db, x.family.slug, y.persons[0]!.id, { relation: 'child', person: person('K') })).rejects.toBeInstanceOf(KinshipError)
  })

  it('works end to end on the sample family', async () => {
    await seedDemoFamily(db)
    const tree = await getTree(db, 'ebi')
    expect(tree.persons).toHaveLength(24)
    const byName = (n: string) => tree.persons.find(p => p.givenName === n)!.id
    expect((await relationship(db, 'ebi', byName('Ebiere'), byName('Wale'))).label).toBe('First cousin')
    expect((await relationship(db, 'ebi', byName('Ebiere'), byName('Ayo'))).label).toBe('First cousin, once removed')
    const added = await addRelative(db, 'ebi', byName('Ebiere'), { relation: 'cousin', viaAuncleId: byName('Ruth'), person: person('Nene', { sex: 'female' }) })
    expect((await relationship(db, 'ebi', byName('Ebiere'), added.focusId)).label).toBe('First cousin')
    const [summary] = await searchFamilies(db, 'ebi')
    expect(summary).toMatchObject({ slug: 'ebi', personCount: 25, minYear: 1936 })
  })

  it('edits a person and turns a placeholder into a real person', async () => {
    const t = await createFamily(db, { name: 'Edit test', visibility: 'public', founder: person('Ada') })
    const ada = t.persons[0]!
    const res = await addRelative(db, t.family.slug, ada.id, { relation: 'sibling', person: person('Bem') })
    const placeholder = res.tree.persons.find(p => p.isPlaceholder)!
    const edited = await updatePerson(db, t.family.slug, placeholder.id, person('Mama', { sex: 'female', birthYear: 1950, birthPlace: 'Yenagoa', notes: 'Matriarch' }))
    expect(edited.persons.find(p => p.id === placeholder.id)).toMatchObject({ givenName: 'Mama', sex: 'female', birthYear: 1950, birthPlace: 'Yenagoa', notes: 'Matriarch', isPlaceholder: false })
    await expect(updatePerson(db, t.family.slug, '00000000-0000-4000-8000-000000000000', person('X'))).rejects.toBeInstanceOf(KinshipError)
  })

  it('removes a leaf, clears orphaned placeholders, and keeps the rest connected', async () => {
    const t = await createFamily(db, { name: 'Remove test', visibility: 'public', founder: person('Ada') })
    const ada = t.persons[0]!
    const { focusId: bem } = await addRelative(db, t.family.slug, ada.id, { relation: 'sibling', person: person('Bem') })
    expect((await getTree(db, t.family.slug)).persons).toHaveLength(3) // Ada, Bem, placeholder parent
    const afterBem = await removePerson(db, t.family.slug, bem)
    expect(afterBem.persons.map(p => p.givenName).sort()).toEqual(['Ada', 'Unknown'])
    await expect(removePerson(db, t.family.slug, afterBem.persons.find(p => p.isPlaceholder)!.id)).resolves.toMatchObject({ persons: [{ givenName: 'Ada' }] })
  })

  it('refuses to remove someone whose removal would strand people, or the last person', async () => {
    const t = await createFamily(db, { name: 'Guard test', visibility: 'public', founder: person('Ada') })
    const ada = t.persons[0]!
    const { focusId: kid } = await addRelative(db, t.family.slug, ada.id, { relation: 'child', person: person('Kid') })
    const { focusId: grandkid } = await addRelative(db, t.family.slug, kid, { relation: 'child', person: person('Grandkid') })
    await expect(removePerson(db, t.family.slug, kid)).rejects.toMatchObject({ status: 409 })
    expect((await getTree(db, t.family.slug)).persons).toHaveLength(3)
    await removePerson(db, t.family.slug, grandkid)
    await removePerson(db, t.family.slug, kid)
    await expect(removePerson(db, t.family.slug, ada.id)).rejects.toMatchObject({ status: 409, message: 'A family needs at least one person' })
  })
})
