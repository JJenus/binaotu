import type { FamilyGraph } from '#shared/kinship'
import { OWN_TIER, TIER_TITLES, buildTiers, relate } from '#shared/kinship'
import type { StageMode } from '~/utils/stageLayout'

/** The person with the most recorded kin makes the most interesting first view. */
function bestStart(g: FamilyGraph) {
  const reach = (id: string) => g.parents(id).length + g.children(id).length + g.partners(id).length + g.siblings(id).length
  return g.ids().sort((a, b) => reach(b) - reach(a))[0]!
}

/**
 * View state only: ring or grid, whose family is shown, and which row the ring
 * shows: either a row relative to the anchor (parents, cousins…) or a whole generation.
 */
export function useTreeView(graph: Ref<FamilyGraph>, generations: Ref<string[][]>) {
  const mode = ref<StageMode>('ring')
  const anchorId = ref(bestStart(graph.value))
  const tierIndex = ref(OWN_TIER)
  const generation = ref<number | null>(null)
  const centeredId = ref(anchorId.value)

  const tiers = computed(() => buildTiers(graph.value, anchorId.value))
  const ring = computed(() => generation.value !== null ? generations.value[generation.value] ?? [] : tiers.value.rows[tierIndex.value] ?? [])
  const chips = computed(() => tiers.value.rows.map((ids, index) => ({ index, title: TIER_TITLES[index]!, ids })).filter(c => c.ids.length))
  const generationPills = computed(() => generations.value.map((ids, index) => ({ index, title: toRoman(index + 1), count: ids.length })))
  const relationToAnchor = (id: string) => id === anchorId.value ? 'Anchor' : relate(graph.value, anchorId.value, id)?.label ?? ''

  const middleOf = (row: string[]) => row.includes(anchorId.value) ? anchorId.value : row[Math.floor((row.length - 1) / 2)]!

  /** Make `id` the centre of the tree. */
  function setAnchor(id: string) {
    anchorId.value = id
    tierIndex.value = OWN_TIER
    generation.value = null
    centeredId.value = id
    mode.value = 'ring'
  }
  function setTier(index: number) {
    generation.value = null
    tierIndex.value = index
    centeredId.value = middleOf(ring.value)
  }
  function setGeneration(index: number) {
    generation.value = index
    mode.value = 'ring'
    centeredId.value = middleOf(ring.value)
  }
  const setMode = (m: StageMode) => { mode.value = m }

  // If the anchor was removed, fall back to the best remaining start.
  watch(graph, (g) => { if (!g.has(anchorId.value)) setAnchor(bestStart(g)); else if (!g.has(centeredId.value)) centeredId.value = anchorId.value })
  return { mode, anchorId, tierIndex, generation, centeredId, tiers, ring, chips, generationPills, relationToAnchor, setAnchor, setTier, setGeneration, setMode }
}
