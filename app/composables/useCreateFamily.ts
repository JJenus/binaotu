import type { Visibility } from '#shared/types'
import { familiesApi } from '~/api'

export function useCreateFamily(initialName = '') {
  const form = reactive({ name: initialName, visibility: 'public' as Visibility, founder: emptyDraft(initialName) })
  const state = useFormState()

  async function submit() {
    const tree = await state.run(() => familiesApi.create({ name: form.name, visibility: form.visibility, founder: draftToInput(form.founder) }))
    if (tree) await navigateTo(`/f/${tree.family.slug}`)
  }
  return { form, ...state, submit }
}
