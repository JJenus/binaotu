import type { LoginInput, RegisterInput } from '#shared/schemas'
import type { UserDTO } from '#shared/types'
import { request } from './http'

export const authApi = {
  /** The signed-in user, or null (an empty response is also “nobody”). */
  me: async () => (await request<UserDTO | null | undefined>('/auth/me')) ?? null,
  register: (input: RegisterInput) => request<UserDTO>('/auth/register', { method: 'POST', body: input }),
  login: (input: LoginInput) => request<UserDTO>('/auth/login', { method: 'POST', body: input }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' })
}
