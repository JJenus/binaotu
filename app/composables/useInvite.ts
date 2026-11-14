import { sharingApi } from '~/api'

/** Previews an invite link and accepts it for the signed-in user. */
export async function useInvite(token: string) {
  const { data: preview, error } = await useAsyncData(`invite:${token}`, () => sharingApi.previewInvite(token))
  const state = useFormState()

  async function accept() {
    const res = await state.run(() => sharingApi.acceptInvite(token))
    if (res) await navigateTo(`/f/${res.familySlug}`, { external: true })
  }
  return { preview, unavailable: computed(() => !!error.value || !preview.value), ...state, accept }
}
