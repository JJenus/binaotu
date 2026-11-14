import type { InviteDTO, InvitePreviewDTO, MembersDTO, Role } from '#shared/types'
import { request } from './http'

const family = (slug: string) => `/families/${encodeURIComponent(slug)}`

export const sharingApi = {
  members: (slug: string) => request<MembersDTO>(`${family(slug)}/members`),
  createInvite: (slug: string, role: 'editor' | 'viewer') => request<InviteDTO>(`${family(slug)}/invites`, { method: 'POST', body: { role } }),
  revokeInvite: (slug: string, token: string) => request<{ ok: true }>(`${family(slug)}/invites/${encodeURIComponent(token)}`, { method: 'DELETE' }),
  setRole: (slug: string, userId: string, role: Role) => request<MembersDTO>(`${family(slug)}/members/${userId}`, { method: 'PATCH', body: { role } }),
  removeMember: (slug: string, userId: string) => request<{ ok: true }>(`${family(slug)}/members/${userId}`, { method: 'DELETE' }),
  previewInvite: (token: string) => request<InvitePreviewDTO>(`/invites/${encodeURIComponent(token)}`),
  acceptInvite: (token: string) => request<{ familySlug: string }>(`/invites/${encodeURIComponent(token)}/accept`, { method: 'POST' })
}
