import type { Sex } from '../types'
import { KinshipError } from './errors'

export interface GraphPerson { id: string, sex: Sex, birthYear?: number | null }
export interface GraphInput {
  persons: GraphPerson[]
  parentLinks: { childId: string, parentId: string }[]
  unions: { partnerAId: string, partnerBId: string }[]
}

const add = (m: Map<string, Set<string>>, k: string, v: string) => (m.get(k) ?? m.set(k, new Set()).get(k)!).add(v)

/** In-memory family graph. Stores facts only; every relationship is derived from them. */
export class FamilyGraph {
  private people = new Map<string, GraphPerson>()
  private up = new Map<string, Set<string>>()
  private down = new Map<string, Set<string>>()
  private mates = new Map<string, Set<string>>()

  constructor(input?: GraphInput) {
    input?.persons.forEach(p => this.addPerson(p))
    input?.parentLinks.forEach(l => this.link(l.childId, l.parentId))
    input?.unions.forEach(u => this.couple(u.partnerAId, u.partnerBId))
  }

  addPerson(p: GraphPerson) { this.people.set(p.id, { id: p.id, sex: p.sex, birthYear: p.birthYear ?? null }) }
  link(childId: string, parentId: string) { this.person(childId); this.person(parentId); add(this.up, childId, parentId); add(this.down, parentId, childId) }
  couple(a: string, b: string) { this.person(a); this.person(b); add(this.mates, a, b); add(this.mates, b, a) }

  toInput(): GraphInput {
    return {
      persons: [...this.people.values()],
      parentLinks: [...this.up].flatMap(([childId, ps]) => [...ps].map(parentId => ({ childId, parentId }))),
      unions: [...this.mates].flatMap(([a, bs]) => [...bs].filter(b => a < b).map(b => ({ partnerAId: a, partnerBId: b })))
    }
  }

  clone() { return new FamilyGraph(this.toInput()) }

  has(id: string) { return this.people.has(id) }
  ids() { return [...this.people.keys()] }
  person(id: string): GraphPerson {
    const p = this.people.get(id)
    if (!p) throw new KinshipError('NOT_FOUND', `Person ${id} is not in this family`)
    return p
  }

  private byBirth = (a: string, b: string) => (this.people.get(a)!.birthYear ?? 9999) - (this.people.get(b)!.birthYear ?? 9999) || a.localeCompare(b)
  parents(id: string) { return [...(this.up.get(id) ?? [])] }
  children(id: string) { return [...(this.down.get(id) ?? [])].sort(this.byBirth) }
  partners(id: string) { return [...(this.mates.get(id) ?? [])] }

  /** Everyone who shares at least one parent with `id`, with the parents they share. */
  siblings(id: string): { id: string, shared: string[] }[] {
    const found = new Map<string, string[]>()
    for (const p of this.parents(id)) {
      for (const c of this.children(p)) if (c !== id) (found.get(c) ?? found.set(c, []).get(c)!).push(p)
    }
    return [...found].map(([sid, shared]) => ({ id: sid, shared })).sort((a, b) => this.byBirth(a.id, b.id))
  }

  /** Half-siblings share some, but not all, known parents. */
  isHalfSibling(a: string, b: string) {
    const pa = new Set(this.parents(a)), pb = this.parents(b)
    const shared = pb.filter(p => pa.has(p)).length
    return shared > 0 && new Set([...pa, ...pb]).size > shared
  }

  /** Self (depth 0) and every ancestor, each at its shortest distance. */
  ancestors(id: string): Map<string, number> {
    const depth = new Map<string, number>([[id, 0]])
    let layer = [id]
    for (let d = 1; layer.length; d++) {
      const next: string[] = []
      for (const n of layer) for (const p of this.parents(n)) if (!depth.has(p)) { depth.set(p, d); next.push(p) }
      layer = next
    }
    return depth
  }

  /** Generation rank: founders are 0, a child is one below its deepest parent, a married-in partner matches their spouse. */
  generations(): Map<string, number> {
    const gen = new Map<string, number>()
    const rank = (id: string): number => {
      if (!gen.has(id)) { const ps = this.parents(id); gen.set(id, ps.length ? 1 + Math.max(...ps.map(rank)) : 0) }
      return gen.get(id)!
    }
    this.ids().forEach(rank)
    for (const id of this.ids()) {
      if (this.parents(id).length) continue
      const withParents = this.partners(id).find(p => this.parents(p).length)
      if (withParents) gen.set(id, gen.get(withParents)!)
    }
    return gen
  }
}
