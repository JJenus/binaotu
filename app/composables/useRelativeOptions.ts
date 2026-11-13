import type { FamilyGraph } from '#shared/kinship'
import { availableRelations, viaCandidates } from '#shared/kinship'
import type { PersonDTO } from '#shared/types'
import type { ViaSource } from '~/utils/relations'

export interface Option { id: string, label: string }

/** What can be added to a person right now, and who the "via" choices are. */
export function useRelativeOptions(graph: Ref<FamilyGraph>, people: Ref<Map<string, PersonDTO>>, anchorId: Ref<string | null>) {
  const named = (ids: string[]): Option[] => ids.map(id => ({ id, label: displayName(people.value.get(id)!) }))
  const relations = computed(() => anchorId.value ? availableRelations(graph.value, anchorId.value) : [])
  const via = computed<Record<ViaSource, Option[]>>(() => {
    const v = anchorId.value ? viaCandidates(graph.value, anchorId.value) : { parents: [], siblings: [], auncles: [], children: [] }
    return { parents: named(v.parents), siblings: named(v.siblings), auncles: named(v.auncles), children: named(v.children) }
  })
  const partners = computed(() => anchorId.value ? named(graph.value.partners(anchorId.value)) : [])
  return { relations, via, partners }
}
