import type { FamilyGraph } from '#shared/kinship'
import { TIER_ROLE_ORDER, buildTiers, relate } from '#shared/kinship'
import type { PersonDTO } from '#shared/types'

export interface ProfileLine { id: string, label: string, name: string }

/** A person’s relatives as an ordered ledger: who they are to this person. */
export function useProfile(graph: Ref<FamilyGraph>, people: Ref<Map<string, PersonDTO>>, id: Ref<string | null>) {
  const person = computed(() => id.value ? people.value.get(id.value) ?? null : null)
  const lines = computed<ProfileLine[]>(() => {
    if (!id.value) return []
    const { roles } = buildTiers(graph.value, id.value)
    return TIER_ROLE_ORDER.flatMap(role => Object.keys(roles).filter(k => roles[k] === role).map(k => ({
      id: k, label: relate(graph.value, id.value!, k)?.label ?? '', name: displayName(people.value.get(k)!)
    })))
  })
  return { person, lines }
}
