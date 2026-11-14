import type { FamilyGraph } from '#shared/kinship'
import { relate, relationPath } from '#shared/kinship'
import type { PersonDTO } from '#shared/types'

export interface RelationStep { id: string, name: string, via: string | null }
export type RelationResult =
  | { kind: 'same' }
  | { kind: 'none' }
  | { kind: 'related', label: string, sentence: string, steps: RelationStep[] }

/** "How are we related?" for any two people, answered from the graph already in memory. */
export function useRelationFinder(graph: Ref<FamilyGraph>, people: Ref<Map<string, PersonDTO>>) {
  const from = ref('')
  const to = ref('')
  const nameOf = (id: string) => displayName(people.value.get(id)!)
  const options = computed(() => [...people.value.values()].map(p => ({ id: p.id, label: displayName(p) })).sort((x, y) => x.label.localeCompare(y.label)))

  const result = computed<RelationResult | null>(() => {
    const g = graph.value
    if (!from.value || !to.value || !g.has(from.value) || !g.has(to.value)) return null
    if (from.value === to.value) return { kind: 'same' }
    const rel = relate(g, from.value, to.value), path = relationPath(g, from.value, to.value)
    if (!rel || !path) return { kind: 'none' }
    return {
      kind: 'related',
      label: rel.label,
      sentence: `${nameOf(to.value)} is ${nameOf(from.value)}’s ${rel.label.toLowerCase()}`,
      steps: path.map((id, i) => ({ id, name: nameOf(id), via: i ? relate(g, path[i - 1]!, id)?.label ?? null : null }))
    }
  })

  const swap = () => { [from.value, to.value] = [to.value, from.value] }
  return { from, to, options, result, swap }
}
