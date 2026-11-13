import type { FamilyGraph } from './graph'

const neighbours = (g: FamilyGraph, id: string) => [...g.parents(id), ...g.children(id), ...g.partners(id)]

/** The shortest chain of direct links (parent, child, partner) from `a` to `b`, or null when unconnected. */
export function relationPath(g: FamilyGraph, a: string, b: string): string[] | null {
  g.person(a); g.person(b)
  const from = new Map<string, string>([[a, a]])
  const queue = [a]
  while (queue.length) {
    const n = queue.shift()!
    if (n === b) break
    for (const m of neighbours(g, n)) if (!from.has(m)) { from.set(m, n); queue.push(m) }
  }
  if (!from.has(b)) return null
  const path = [b]
  for (let c = b; c !== a;) path.unshift(c = from.get(c)!)
  return path
}

/** People who would be cut off from the main family if `id` were removed. Empty when removal is safe. */
export function wouldDisconnect(g: FamilyGraph, id: string): string[] {
  const rest = g.ids().filter(x => x !== id)
  const seen = new Set<string>()
  const components: string[][] = []
  for (const start of rest) {
    if (seen.has(start)) continue
    const comp = [start]
    seen.add(start)
    for (let i = 0; i < comp.length; i++) {
      for (const m of neighbours(g, comp[i]!)) if (m !== id && !seen.has(m)) { seen.add(m); comp.push(m) }
    }
    components.push(comp)
  }
  if (components.length <= 1) return []
  const main = components.reduce((a, b) => b.length > a.length ? b : a)
  return components.filter(c => c !== main).flat()
}
