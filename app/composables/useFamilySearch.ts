import { familiesApi } from '~/api'

export function useFamilySearch() {
  const q = ref('')
  const settled = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(q, (v) => { clearTimeout(timer); timer = setTimeout(() => { settled.value = v }, 250) })
  onScopeDispose(() => clearTimeout(timer))

  const { data, pending, error } = useAsyncData('family-search', () => familiesApi.search(settled.value), { watch: [settled], default: () => [] })
  return { q, results: data, pending, error: computed(() => error.value?.message ?? null), searched: computed(() => settled.value.trim().length > 0) }
}
