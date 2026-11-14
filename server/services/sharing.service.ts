import { randomBytes } from 'node:crypto'
import type { Db } from '../db/client'
import * as familyRepo from '../repositories/family.repo'
import * as memberRepo from '../repositories/member.repo'
import type { InviteDTO, InvitePreviewDTO, MembersDTO, Role } from '../../shared/types'
import { authorize, type Viewer } from './access.service'
import { AppError } from './errors'

const INVITE_DAYS = 7
const RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 }
const gone = () => new AppError(404, 'This invite link has expired or doesn’t exist')

export async function createInvite(db: Db, slug: string, role: 'editor' | 'viewer', viewer: Viewer): Promise<InviteDTO> {
  const { family } = await authorize(db, slug, viewer, 'manage')
  return memberRepo.insertInvite(db, { familyId: family.id, role, token: randomBytes(24).toString('base64url'), expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) })
}

export async function revokeInvite(db: Db, slug: string, token: string, viewer: Viewer): Promise<void> {
  const { family } = await authorize(db, slug, viewer, 'manage')
  await memberRepo.deleteInvite(db, family.id, token)
}

export async function listMembers(db: Db, slug: string, viewer: Viewer): Promise<MembersDTO> {
  const { family } = await authorize(db, slug, viewer, 'manage')
  const [members, invites] = await Promise.all([memberRepo.listMembers(db, family.id), memberRepo.activeInvites(db, family.id)])
  return { members, invites }
}

/** What the invite offers, shown before the person decides to join. */
export async function previewInvite(db: Db, token: string): Promise<InvitePreviewDTO> {
  const invite = await memberRepo.findInvite(db, token)
  const family = invite && await familyRepo.findById(db, invite.familyId)
  if (!invite || !family) throw gone()
  return { familyName: family.name, familySlug: family.slug, role: invite.role, expiresAt: invite.expiresAt.toISOString() }
}

/** Joins the family. Someone who already has a higher role keeps it. */
export async function acceptInvite(db: Db, token: string, userId: string): Promise<{ familySlug: string }> {
  const invite = await memberRepo.findInvite(db, token)
  const family = invite && await familyRepo.findById(db, invite.familyId)
  if (!invite || !family) throw gone()
  const current = await memberRepo.roleOf(db, family.id, userId)
  if (!current || RANK[invite.role] > RANK[current]) await memberRepo.setMember(db, family.id, userId, invite.role)
  return { familySlug: family.slug }
}

async function guardLastOwner(db: Db, familyId: string, userId: string) {
  if (await memberRepo.roleOf(db, familyId, userId) === 'owner' && await memberRepo.countOwners(db, familyId) <= 1) {
    throw new AppError(409, 'A family needs at least one owner. Make someone else an owner first.')
  }
}

export async function setMemberRole(db: Db, slug: string, userId: string, role: Role, viewer: Viewer): Promise<MembersDTO> {
  const { family } = await authorize(db, slug, viewer, 'manage')
  if (!await memberRepo.roleOf(db, family.id, userId)) throw new AppError(404, 'That person is not a member of this family')
  if (role !== 'owner') await guardLastOwner(db, family.id, userId)
  await memberRepo.setMember(db, family.id, userId, role)
  return listMembers(db, slug, viewer)
}

/** Owners can remove anyone; any member can leave. */
export async function removeMember(db: Db, slug: string, userId: string, viewer: Viewer): Promise<void> {
  const leaving = viewer.userId === userId
  const { family } = await authorize(db, slug, viewer, leaving ? 'view' : 'manage')
  if (!await memberRepo.roleOf(db, family.id, userId)) throw new AppError(404, 'That person is not a member of this family')
  await guardLastOwner(db, family.id, userId)
  await memberRepo.removeMember(db, family.id, userId)
}
