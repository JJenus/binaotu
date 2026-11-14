import { familiesApi } from '~/api'

/** The families the signed-in user belongs to. Empty for visitors. */
export function useMyFamilies() {
  const { isSignedIn } = useAuth()
  const { data } = useAsyncData('my-families', () => isSignedIn.value ? familiesApi.mine() : Promise.resolve([]), { default: () => [] })
  return { families: data }
}
