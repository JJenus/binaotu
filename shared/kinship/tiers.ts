import type { FamilyGraph } from './graph'

export type TierRole = 'me' | 'gp' | 'parent' | 'au' | 'aus' | 'sib' | 'spouse' | 'cz' | 'child' | 'nb' | 'cc' | 'gc'

export const TIER_TITLES = ['Grandparents', 'Parents and aunts/uncles', 'Siblings and cousins', 'Children and nieces/nephews', 'Grandchildren'] as const
/** Display order for a ledger of relatives. */
export const TIER_ROLE_ORDER: TierRole[] = ['gp', 'parent', 'au', 'aus', 'sib', 'spouse', 'cz', 'child', 'nb', 'cc', 'gc']
/** The tier that holds the anchor and their own generation. */
export const OWN_TIER = 2

export interface Tiers {
  /** Five rows, top to bottom: grandparents, parents and their siblings, own generation, next generation, grandchildren. Left to right follows the mother's/father's side. */
  rows: string[][]
  roles: Record<string, TierRole>
}

export function buildTiers(g: FamilyGraph, anchor: string): Tiers {
  const seen = new Set([anchor])
  const roles: Record<string, TierRole> = { [anchor]: 'me' }
  const grab = (ids: (string | undefined)[], role: TierRole) =>
    ids.filter((i): i is string => !!i && !seen.has(i) && (seen.add(i), (roles[i] = role), true))
  const birth = (id: string) => g.person(id).birthYear ?? 0
  const kids = (id: string) => g.children(id)

  const [p0, p1] = g.parents(anchor)
  const sibs = g.siblings(anchor).map(s => s.id)
  const me = birth(anchor)
  const parents = grab(g.parents(anchor), 'parent')
  const spouses = grab(g.partners(anchor), 'spouse')
  const older = grab(sibs.filter(s => birth(s) <= me), 'sib')
  const younger = grab(sibs.filter(s => birth(s) > me), 'sib')
  const children = grab(kids(anchor), 'child')
  const grandchildren = grab(children.flatMap(kids), 'gc')
  const gpL = grab(p0 ? g.parents(p0) : [], 'gp')
  const gpR = grab(p1 ? g.parents(p1) : [], 'gp')

  const side = (p?: string) => {
    const aunts = grab(p ? g.siblings(p).map(s => s.id) : [], 'au')
    const inLaws = grab(aunts.flatMap(a => g.partners(a)), 'aus')
    const list = aunts.flatMap(a => [a, ...inLaws.filter(x => g.partners(a).includes(x))])
    const cousins = grab(aunts.flatMap(kids), 'cz')
    const cousinKids = grab(cousins.flatMap(kids), 'cc')
    return { list, cousins, cousinKids }
  }
  const L = side(p0), R = side(p1)
  const nephewsOlder = grab(older.flatMap(kids), 'nb')
  const nephewsYounger = grab(younger.flatMap(kids), 'nb')

  return {
    roles,
    rows: [
      [...gpL, ...gpR],
      [...L.list, ...parents, ...R.list],
      [...L.cousins, ...older, anchor, ...spouses, ...younger, ...R.cousins],
      [...L.cousinKids, ...nephewsOlder, ...children, ...nephewsYounger, ...R.cousinKids],
      grandchildren
    ]
  }
}
