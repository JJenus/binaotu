import type { LoginInput, RegisterInput } from '#shared/schemas'
import type { UserDTO } from '#shared/types'
import { authApi } from '~/api'

/** Who is signed in. `undefined` means not loaded yet; `null` means nobody. Shared across the whole app. */
export function useAuth() {
  const user = useState<UserDTO | null | undefined>('auth:user', () => undefined)
  const state = useFormState()

  async function refresh() {
    try { user.value = await authApi.me() } catch { user.value = null }
  }
  async function signInWith(action: () => Promise<UserDTO>) {
    const next = await state.run(action)
    if (next) user.value = next
    return !!next
  }
  const login = (input: LoginInput) => signInWith(() => authApi.login(input))
  const register = (input: RegisterInput) => signInWith(() => authApi.register(input))

  /** Reloads the app signed out so nothing private lingers in memory. */
  async function logout() {
    await authApi.logout()
    user.value = null
    await navigateTo('/', { external: true })
  }
  return { user, isSignedIn: computed(() => !!user.value), ...state, login, register, logout, refresh }
}
