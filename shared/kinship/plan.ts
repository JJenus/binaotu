import type { AddRelativeInput, PersonInput } from '../schemas'
import type { ParentKind, UnionKind } from '../types'
import { KinshipError } from './errors'
import type { FamilyGraph } from './graph'

export interface PlannedPerson extends PersonInput { id: string, isPlaceholder: boolean }
export interface Plan {
  persons: PlannedPerson[]
  parentLinks: { childId: string, parentId: string, kind: ParentKind }[]
  unions: { id: string, partnerAId: string, partnerBId: string, kind: UnionKind }[]
  /** The person the caller asked to add (the rest are placeholders or side effects). */
  focusId: string
}

const need = (id: string | null | undefined, allowed: string[], message: string): string => {
  if (!id || !allowed.includes(id)) throw new KinshipError('INVALID', message)
  return id
}

class Planner {
  readonly plan: Plan = { persons: [], parentLinks: [], unions: [], focusId: '' }
  constructor(private g: FamilyGraph, private newId: () => string) {}

  // ---- low-level writes: every one updates the plan and the working graph together ----
  private create(person: PersonInput, isPlaceholder = false) {
    const id = this.newId()
    this.plan.persons.push({ ...person, id, isPlaceholder })
    this.g.addPerson({ id, sex: person.sex ?? 'unknown', birthYear: person.birthYear })
    return id
  }
  private placeholder() { return this.create({ givenName: 'Unknown', sex: 'unknown' }, true) }
  private link(childId: string, parentId: string, kind: ParentKind = 'biological') {
    this.g.link(childId, parentId)
    this.plan.parentLinks.push({ childId, parentId, kind })
  }
  private couple(a: string, b: string, kind: UnionKind = 'partnership') {
    if (this.g.partners(a).includes(b)) return
    this.g.couple(a, b)
    this.plan.unions.push({ id: this.newId(), partnerAId: a, partnerBId: b, kind })
  }

  // ---- the four primitives; every other relation is a composition of these ----
  child(parentId: string, person: PersonInput, otherParentId?: string | null) {
    if (otherParentId) {
      this.g.person(otherParentId)
      if (otherParentId === parentId) throw new KinshipError('INVALID', 'The other parent must be a different person')
    }
    const id = this.create(person)
    this.link(id, parentId)
    if (otherParentId) { this.link(id, otherParentId); this.couple(parentId, otherParentId) }
    return id
  }

  parent(childId: string, person: PersonInput) {
    const existing = this.g.parents(childId)
    if (existing.length >= 2) throw new KinshipError('MAX_PARENTS', 'This person already has two parents')
    const same = new Set(existing)
    // full siblings (same parent set) get the new parent too, so they stay full siblings
    const fullSiblings = this.g.siblings(childId).map(s => s.id)
      .filter(s => this.g.parents(s).length === existing.length && this.g.parents(s).every(p => same.has(p)))
    const id = this.create(person)
    for (const c of [childId, ...fullSiblings]) this.link(c, id)
    if (existing[0]) this.couple(existing[0], id)
    return id
  }

  partner(personId: string, person: PersonInput, kind: UnionKind) {
    const id = this.create(person)
    this.couple(personId, id, kind)
    return id
  }

  sibling(personId: string, person: PersonInput, kind: 'full' | 'half', sharedParentId?: string | null) {
    let parents = this.g.parents(personId)
    if (kind === 'half') {
      const shared = need(sharedParentId, parents, 'Choose which parent they share')
      const id = this.create(person)
      this.link(id, shared)
      this.link(id, this.placeholder()) // their other parent is unknown, which is what makes them half
      return id
    }
    if (!parents.length) {
      const unknown = this.placeholder()
      this.link(personId, unknown)
      parents = [unknown]
    }
    const id = this.create(person)
    parents.forEach(p => this.link(id, p))
    return id
  }
}

/**
 * Works out everything needed to add `input.person` relative to `anchorId`:
 * the new person, any placeholder parents, parent links and unions.
 * Pure: the passed graph is not modified.
 */
export function planAddRelative(graph: FamilyGraph, anchorId: string, input: AddRelativeInput, newId: () => string = () => crypto.randomUUID()): Plan {
  const g = graph.clone()
  g.person(anchorId)
  const p = new Planner(g, newId)
  const parents = g.parents(anchorId)
  const siblings = g.siblings(anchorId).map(s => s.id)
  let focus: string
  switch (input.relation) {
    case 'child': focus = p.child(anchorId, input.person, input.otherParentId); break
    case 'parent': focus = p.parent(anchorId, input.person); break
    case 'partner': focus = p.partner(anchorId, input.person, input.kind ?? 'partnership'); break
    case 'sibling': focus = p.sibling(anchorId, input.person, input.kind ?? 'full', input.sharedParentId); break
    case 'auncle': focus = p.sibling(need(input.viaParentId, parents, 'Choose one of their parents'), input.person, 'full'); break
    case 'nibling': focus = p.child(need(input.viaSiblingId, siblings, 'Choose one of their siblings'), input.person); break
    case 'cousin': focus = p.child(need(input.viaAuncleId, parents.flatMap(x => g.siblings(x).map(s => s.id)), 'Choose an aunt or uncle of this person'), input.person); break
    case 'grandparent': focus = p.parent(need(input.viaParentId, parents, 'Choose one of their parents'), input.person); break
    case 'grandchild': focus = p.child(need(input.viaChildId, g.children(anchorId), 'Choose one of their children'), input.person); break
  }
  p.plan.focusId = focus
  return p.plan
}
