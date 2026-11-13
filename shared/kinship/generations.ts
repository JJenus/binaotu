import type { FamilyGraph } from './graph'

/**
 * Everyone, one row per generation (oldest first). Within a row, siblings sit
 * under their parents’ position in the row above and a married-in partner sits
 * right after their spouse, so the family reads as a tree.
 */
export function generationRows(g: FamilyGraph): string[][] {
  const gen = g.generations()
  const depth = Math.max(-1, ...gen.values())
  const birth = (id: string) => g.person(id).birthYear ?? 9999
  const rows: string[][] = []
  for (let level = 0; level <= depth; level++) {
    const ids = g.ids().filter(id => gen.get(id) === level)
    const above = rows[level - 1] ?? []
    const key = (id: string) => {
      const at = g.parents(id).map(p => above.indexOf(p)).filter(i => i >= 0)
      return at.length ? Math.min(...at) : null
    }
    const placed = level === 0 ? ids : ids.filter(id => key(id) !== null).sort((a, b) => key(a)! - key(b)! || birth(a) - birth(b))
    const row: string[] = []
    for (const id of placed) {
      if (row.includes(id)) continue
      row.push(id)
      for (const partner of g.partners(id)) if (ids.includes(partner) && !row.includes(partner)) row.push(partner)
    }
    for (const id of ids) if (!row.includes(id)) row.push(id)
    rows.push(row)
  }
  return rows
}
