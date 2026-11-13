import { familiesApi } from '~/api'
import type { AddRelativeInput } from '#shared/schemas'
import { generationRows, graphFromTree } from '#shared/kinship'

/** Loads one family and exposes it as a graph. The only place that fetches or mutates a tree. */
export async function useFamilyTree(slug: string) {
  const { data, error } = await useAsyncData(`family:${slug}`, () => familiesApi.getTree(slug))
  if (error.value || !data.value) {
    throw createError({ statusCode: error.value?.statusCode ?? 404, message: error.value?.message || 'We couldn’t find that family', fatal: true })
  }
  const tree = computed(() => data.value!)
  const graph = computed(() => graphFromTree(tree.value))
  const people = computed(() => new Map(tree.value.persons.map(p => [p.id, p])))
  const gridRows = computed(() => generationRows(graph.value))
  const mutation = useFormState()

  /** Adds a relative to `anchorId`; resolves to the new person’s id, or undefined if it failed (see `mutation`). */
  async function addRelative(anchorId: string, input: AddRelativeInput) {
    const result = await mutation.run(() => familiesApi.addRelative(slug, anchorId, input))
    if (!result) return undefined
    data.value = result.tree
    return result.focusId
  }
  return { tree, graph, people, gridRows, addRelative, mutation }
}
