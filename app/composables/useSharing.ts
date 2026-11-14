import type { InviteDTO, MemberDTO, Role } from '#shared/types'
import { sharingApi } from '~/api'

/** Members and invite links for one family. Only owners can load or change these. */
export function useSharing(slug: string) {
  const members = ref<MemberDTO[]>([])
  const invites = ref<InviteDTO[]>([])
  const state = useFormState()
  const origin = useRequestURL().origin

  async function load() {
    const res = await state.run(() => sharingApi.members(slug))
    if (res) { members.value = res.members; invites.value = res.invites }
  }
  async function invite(role: 'editor' | 'viewer') {
    const created = await state.run(() => sharingApi.createInvite(slug, role))
    if (created) invites.value = [...invites.value, created]
  }
  async function revoke(token: string) {
    if (await state.run(() => sharingApi.revokeInvite(slug, token))) invites.value = invites.value.filter(i => i.token !== token)
  }
  async function setRole(userId: string, role: Role) {
    const res = await state.run(() => sharingApi.setRole(slug, userId, role))
    if (res) { members.value = res.members; invites.value = res.invites }
  }
  async function remove(userId: string) {
    if (await state.run(() => sharingApi.removeMember(slug, userId))) members.value = members.value.filter(m => m.userId !== userId)
  }
  const linkFor = (token: string) => `${origin}/join/${token}`
  return { members, invites, ...state, load, invite, revoke, setRole, remove, linkFor }
}
