import type { Sex } from '../types'
import type { FamilyGraph } from './graph'

export type Role =
  | { kind: 'self' | 'partner' | 'parent' | 'child' | 'sibling' | 'half-sibling' }
  | { kind: 'grandparent' | 'grandchild' | 'auncle' | 'nibling', n: number }
  | { kind: 'cousin', degree: number, removed: number }

export type InLaw = 'spouse-of-relative' | 'relative-of-spouse'
export interface Relationship { role: Role, inLaw: InLaw | null, label: string }

const pick = (sex: Sex, m: string, f: string, n: string) => sex === 'male' ? m : sex === 'female' ? f : n
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)
const great = (k: number) => 'Great-'.repeat(Math.max(0, k))
const ord = (n: number) => ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'][n - 1] ?? `${n}th`
const times = (n: number) => n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`

function baseLabel(role: Role, sex: Sex): string {
  switch (role.kind) {
    case 'self': return 'Self'
    case 'partner': return pick(sex, 'Husband', 'Wife', 'Partner')
    case 'parent': return pick(sex, 'Father', 'Mother', 'Parent')
    case 'child': return pick(sex, 'Son', 'Daughter', 'Child')
    case 'sibling': return pick(sex, 'Brother', 'Sister', 'Sibling')
    case 'half-sibling': return pick(sex, 'Half-brother', 'Half-sister', 'Half-sibling')
    case 'grandparent': { const w = pick(sex, 'grandfather', 'grandmother', 'grandparent'); return role.n === 2 ? cap(w) : great(role.n - 2) + w }
    case 'grandchild': { const w = pick(sex, 'grandson', 'granddaughter', 'grandchild'); return role.n === 2 ? cap(w) : great(role.n - 2) + w }
    case 'auncle': { const w = pick(sex, 'uncle', 'aunt', 'uncle or aunt'); return role.n === 2 ? cap(w) : great(role.n - 2) + w }
    case 'nibling': { const w = pick(sex, 'nephew', 'niece', 'nibling'); return role.n === 2 ? cap(w) : role.n === 3 ? 'Grand' + w : great(role.n - 3) + 'grand' + w }
    case 'cousin': return `${ord(role.degree)} cousin${role.removed ? `, ${times(role.removed)} removed` : ''}`
  }
}

function labelFor(role: Role, sex: Sex, inLaw: InLaw | null): string {
  if (!inLaw) return baseLabel(role, sex)
  const sibling = role.kind === 'sibling' || role.kind === 'half-sibling'
  if (sibling) return pick(sex, 'Brother-in-law', 'Sister-in-law', 'Sibling-in-law')
  if (inLaw === 'spouse-of-relative') {
    if (role.kind === 'child') return pick(sex, 'Son-in-law', 'Daughter-in-law', 'Child-in-law')
    if (role.kind === 'parent') return pick(sex, 'Stepfather', 'Stepmother', 'Stepparent')
    return `${baseLabel(role, sex)} by marriage`
  }
  if (role.kind === 'parent') return pick(sex, 'Father-in-law', 'Mother-in-law', 'Parent-in-law')
  return `Spouse’s ${baseLabel(role, sex).toLowerCase()}`
}

/** What `b` is to `a` by blood, found through the nearest common ancestor. */
function blood(g: FamilyGraph, a: string, b: string): Role | null {
  if (a === b) return { kind: 'self' }
  const A = g.ancestors(a), B = g.ancestors(b)
  let best: [number, number] | null = null
  for (const [id, da] of A) {
    const db = B.get(id)
    if (db !== undefined && (!best || da + db < best[0] + best[1])) best = [da, db]
  }
  if (!best) return null
  const [da, db] = best
  if (da === 0) return db === 1 ? { kind: 'child' } : { kind: 'grandchild', n: db }
  if (db === 0) return da === 1 ? { kind: 'parent' } : { kind: 'grandparent', n: da }
  if (da === 1 && db === 1) return { kind: g.isHalfSibling(a, b) ? 'half-sibling' : 'sibling' }
  if (da === 1) return { kind: 'nibling', n: db }
  if (db === 1) return { kind: 'auncle', n: da }
  return { kind: 'cousin', degree: Math.min(da, db) - 1, removed: Math.abs(da - db) }
}

/** What `b` is to `a` ("b is a’s …"), or null when they are not connected. */
export function relate(g: FamilyGraph, a: string, b: string): Relationship | null {
  const make = (role: Role, inLaw: InLaw | null = null): Relationship => ({ role, inLaw, label: labelFor(role, g.person(b).sex, inLaw) })
  if (a === b) return make({ kind: 'self' })
  if (g.partners(a).includes(b)) return make({ kind: 'partner' })
  const direct = blood(g, a, b)
  if (direct) return make(direct)
  for (const p of g.partners(b)) { const r = blood(g, a, p); if (r) return make(r, 'spouse-of-relative') }
  for (const p of g.partners(a)) { const r = blood(g, p, b); if (r) return make(r, 'relative-of-spouse') }
  return null
}
