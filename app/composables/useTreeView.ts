import type { FamilyGraph } from '#shared/kinship'
import { OWN_TIER, TIER_TITLES, buildTiers, relate } from '#shared/kinship'
import type { StageMode } from '~/utils/stageLayout'

/** The person with the most recorded kin makes the most interesting first view. */
function bestStart(g: FamilyGraph) {
  const reach = (id: string) => g.parents(id).length + g.children(id).length + g.partners(id).length + g.siblings(id).length
  return g.ids().sort((a, b) => reach(b) - reach(a))[0]!
}

/** View state only: ring or grid, whose family is shown, which row, who is centred. */
export function useTreeView(graph: Ref<FamilyGraph>) {
  const mode = ref<StageMode>('ring')
  const anchorId = ref(bestStart(graph.value))
  const tierIndex = ref(OWN_TIER)
  const centeredId = ref(anchorId.value)

  const tiers = computed(() => buildTiers(graph.value, anchorId.value))
  const ring = computed(() => tiers.value.rows[tierIndex.value] ?? [])
  const chips = computed(() => tiers.value.rows.map((ids, index) => ({ index, title: TIER_TITLES[index]!, ids })).filter(c => c.ids.length))
  const relationToAnchor = (id: string) => id === anchorId.value ? 'Anchor' : relate(graph.value, anchorId.value, id)?.label ?? ''

  /** Make `id` the centre of the tree. */
  function setAnchor(id: string) {
    anchorId.value = id
    tierIndex.value = OWN_TIER
    centeredId.value = id
    mode.value = 'ring'
  }
  function setTier(index: number) {
    tierIndex.value = index
    const row = ring.value
    centeredId.value = row.includes(anchorId.value) ? anchorId.value : row[Math.floor((row.length - 1) / 2)]!
  }
  const setMode = (m: StageMode) => { mode.value = m }
  return { mode, anchorId, tierIndex, centeredId, tiers, ring, chips, relationToAnchor, setAnchor, setTier, setMode }
}
