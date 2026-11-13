import { describe, expect, it } from 'vitest'
import { FamilyGraph, KinshipError, buildTiers, planAddRelative, relate } from './index'
import { sampleFamily } from './fixture'

const p = (givenName: string, sex: 'male' | 'female' | 'unknown' = 'unknown') => ({ givenName, sex })
const label = (g: FamilyGraph, a: string, b: string) => relate(g, a, b)?.label

describe('relate (what b is to a)', () => {
  const g = sampleFamily()
  it.each([
    ['e1', 'd1', 'Father'], ['e1', 'm1', 'Mother'], ['e1', 'a1', 'Grandfather'], ['e1', 'b2', 'Grandmother'],
    ['e1', 'e2', 'Brother'], ['e1', 'e3', 'Sister'], ['e1', 'd2', 'Uncle'], ['e1', 'm2', 'Aunt'],
    ['e1', 'c1', 'First cousin'], ['e1', 'k3', 'First cousin, once removed'], ['e1', 'w1', 'Husband'],
    ['e1', 'k1', 'Daughter'], ['d1', 'k1', 'Granddaughter'], ['d1', 'e1', 'Daughter'],
    ['k1', 'a1', 'Great-grandfather'], ['a1', 'k1', 'Great-granddaughter'],
    ['e1', 's1', 'Aunt by marriage'], ['e1', 's3', 'Uncle by marriage'],
    ['w1', 'd1', 'Father-in-law'], ['w1', 'e2', 'Brother-in-law'], ['e2', 'w1', 'Brother-in-law'],
    ['d1', 'w1', 'Son-in-law'], ['c1', 'e1', 'First cousin'], ['d2', 'e1', 'Niece'], ['a1', 'e1', 'Granddaughter'],
    ['k3', 'e1', 'First cousin, once removed']
  ])('%s → %s is %s', (a, b, expected) => expect(label(g, a, b)).toBe(expected))

  it('is null for unconnected people and Self for the same person', () => {
    const lone = g.clone(); lone.addPerson({ id: 'x', sex: 'male' })
    expect(relate(lone, 'e1', 'x')).toBeNull()
    expect(label(g, 'e1', 'e1')).toBe('Self')
  })

  it('tells half-siblings from full siblings', () => {
    const h = g.clone(); h.addPerson({ id: 'h', sex: 'male' }); h.link('h', 'd1')
    expect(label(h, 'e1', 'h')).toBe('Half-brother')
    expect(label(h, 'e1', 'e2')).toBe('Brother')
  })
})

describe('buildTiers', () => {
  const t = buildTiers(sampleFamily(), 'e1')
  it('groups relatives into generations with each side on its own flank', () => {
    expect(t.rows[0]).toEqual(['a1', 'a2', 'b1', 'b2'])
    expect(t.rows[1]).toEqual(['d2', 's1', 'd3', 's2', 'd1', 'm1', 'm2', 's3'])
    expect(t.rows[2]).toEqual(['c1', 'c2', 'c3', 'e1', 'w1', 'e2', 'e3', 'c4', 'c5'])
    expect(t.rows[3]).toEqual(['k3', 'k1', 'k2'])
    expect(t.rows[4]).toEqual([])
  })
  it('never repeats a person', () => {
    const all = t.rows.flat()
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('planAddRelative', () => {
  const ids = () => { let n = 0; return () => `new${++n}` }
  const g = sampleFamily()

  it('does not modify the graph it is given', () => {
    const before = g.toInput()
    planAddRelative(g, 'e1', { relation: 'sibling', person: p('Zed') }, ids())
    expect(g.toInput()).toEqual(before)
  })

  it('adds a full sibling under the same parents', () => {
    const plan = planAddRelative(g, 'e1', { relation: 'sibling', person: p('Zed', 'male') }, ids())
    expect(plan.parentLinks.map(l => l.parentId).sort()).toEqual(['d1', 'm1'])
    expect(plan.persons).toHaveLength(1)
  })

  it('creates a placeholder parent when the anchor has none, and reuses it', () => {
    const plan = planAddRelative(g, 'w1', { relation: 'sibling', person: p('Nnamdi', 'male') }, ids())
    const placeholder = plan.persons.find(x => x.isPlaceholder)!
    expect(plan.parentLinks).toEqual(expect.arrayContaining([
      { childId: 'w1', parentId: placeholder.id, kind: 'biological' },
      { childId: plan.focusId, parentId: placeholder.id, kind: 'biological' }
    ]))
  })

  it('adds a half-sibling who shares exactly one parent', () => {
    const plan = planAddRelative(g, 'e1', { relation: 'sibling', kind: 'half', sharedParentId: 'd1', person: p('Half') }, ids())
    const after = g.clone()
    plan.persons.forEach(x => after.addPerson({ id: x.id, sex: x.sex ?? 'unknown' }))
    plan.parentLinks.forEach(l => after.link(l.childId, l.parentId))
    expect(label(after, 'e1', plan.focusId)).toBe('Half-sibling')
  })

  it('adds an aunt through a parent who has no recorded parents', () => {
    const lone = new FamilyGraph({ persons: [{ id: 'kid', sex: 'male' }, { id: 'mum', sex: 'female' }], parentLinks: [{ childId: 'kid', parentId: 'mum' }], unions: [] })
    const plan = planAddRelative(lone, 'kid', { relation: 'auncle', viaParentId: 'mum', person: p('Auntie', 'female') }, ids())
    expect(plan.persons.filter(x => x.isPlaceholder)).toHaveLength(1)
    const after = lone.clone()
    plan.persons.forEach(x => after.addPerson({ id: x.id, sex: x.sex ?? 'unknown' }))
    plan.parentLinks.forEach(l => after.link(l.childId, l.parentId))
    expect(label(after, 'kid', plan.focusId)).toBe('Aunt')
  })

  it('adds cousins, nephews and grandchildren through the right intermediary', () => {
    expect(planAddRelative(g, 'e1', { relation: 'cousin', viaAuncleId: 'd2', person: p('C') }, ids()).parentLinks).toEqual([{ childId: 'new1', parentId: 'd2', kind: 'biological' }])
    expect(planAddRelative(g, 'e1', { relation: 'nibling', viaSiblingId: 'e2', person: p('N') }, ids()).focusId).toBe('new1')
    expect(planAddRelative(g, 'd1', { relation: 'grandchild', viaChildId: 'e2', person: p('G') }, ids()).parentLinks[0]).toMatchObject({ parentId: 'e2' })
  })

  it('links both parents and records their union when adding a child', () => {
    const plan = planAddRelative(g, 'e2', { relation: 'child', otherParentId: 'c3', person: p('Kid') }, ids())
    expect(plan.parentLinks).toHaveLength(2)
    expect(plan.unions).toMatchObject([{ partnerAId: 'e2', partnerBId: 'c3' }])
  })

  it('adding a second parent also links full siblings and couples the parents', () => {
    const one = new FamilyGraph({ persons: ['a', 'b', 'p'].map(id => ({ id, sex: 'unknown' as const })), parentLinks: [{ childId: 'a', parentId: 'p' }, { childId: 'b', parentId: 'p' }], unions: [] })
    const plan = planAddRelative(one, 'a', { relation: 'parent', person: p('Dad', 'male') }, ids())
    expect(plan.parentLinks.map(l => l.childId).sort()).toEqual(['a', 'b'])
    expect(plan.unions).toMatchObject([{ partnerAId: 'p', partnerBId: 'new1' }])
  })

  it.each([
    ['third parent', 'e1', { relation: 'parent', person: p('X') }, 'MAX_PARENTS'],
    ['uncle via a non-parent', 'e1', { relation: 'auncle', viaParentId: 'a1', person: p('X') }, 'INVALID'],
    ['half-sibling without a shared parent', 'e1', { relation: 'sibling', kind: 'half', person: p('X') }, 'INVALID'],
    ['cousin via a non-aunt', 'e1', { relation: 'cousin', viaAuncleId: 'e2', person: p('X') }, 'INVALID'],
    ['child with themselves as other parent', 'e1', { relation: 'child', otherParentId: 'e1', person: p('X') }, 'INVALID'],
    ['unknown anchor', 'nobody', { relation: 'child', person: p('X') }, 'NOT_FOUND']
  ] as const)('rejects %s', (_n, anchor, input, code) => {
    try { planAddRelative(g, anchor, input as any, ids()); expect.unreachable() } catch (e) { expect(e).toBeInstanceOf(KinshipError); expect((e as KinshipError).code).toBe(code) }
  })
})
