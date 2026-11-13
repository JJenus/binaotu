import type { PersonDTO } from '#shared/types'
import { birthBounds, dimmedIds, type YearSpan } from '~/utils/yearRange'

/** Birth-year filter: which span is selected, and who falls outside it. */
export function useYearRange(persons: Ref<PersonDTO[]>) {
  const bounds = computed(() => birthBounds(persons.value))
  const span = ref<YearSpan>(bounds.value ? [...bounds.value] : [0, 0])
  watch(bounds, (next, prev) => {
    if (!next) return
    const wasFull = !prev || (span.value[0] === prev[0] && span.value[1] === prev[1])
    span.value = wasFull ? [...next] : [Math.max(next[0], span.value[0]), Math.min(next[1], span.value[1])]
  })
  const available = computed(() => !!bounds.value && bounds.value[1] > bounds.value[0])
  const dimmed = computed(() => available.value ? dimmedIds(persons.value, span.value) : new Set<string>())
  const reset = () => { if (bounds.value) span.value = [...bounds.value] }
  return { bounds, span, available, dimmed, reset }
}
