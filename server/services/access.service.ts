import type { Db } from '../db/client'
import * as familyRepo from '../repositories/family.repo'
import * as memberRepo from '../repositories/member.repo'
import type { AccessDTO, FamilyDTO } from '../../shared/types'
import { AppError } from './errors'

/** Who is asking. `userId` is null for visitors who are not signed in. */
export interface Viewer { userId: string | null }
export type Action = 'view' | 'edit' | 'manage'

const notFound = () => new AppError(404, 'We couldn’t find that family')

export async function accessFor(db: Db, family: FamilyDTO, viewer: Viewer): Promise<AccessDTO> {
  const role = viewer.userId ? await memberRepo.roleOf(db, family.id, viewer.userId) : null
  return { role, canEdit: role === 'owner' || role === 'editor', canManage: role === 'owner' }
}

/**
 * Finds a family by slug and checks the viewer may do `action` on it.
 * Private families look like they do not exist to anyone who is not a member.
 */
export async function authorize(db: Db, slug: string, viewer: Viewer, action: Action): Promise<{ family: FamilyDTO, access: AccessDTO }> {
  const family = await familyRepo.findBySlug(db, slug)
  if (!family) throw notFound()
  const access = await accessFor(db, family, viewer)
  if (family.visibility === 'private' && !access.role) throw notFound()
  const allowed = action === 'view' || (action === 'edit' ? access.canEdit : access.canManage)
  if (!allowed) throw viewer.userId ? new AppError(403, 'You don’t have permission to do that') : new AppError(401, 'Sign in to do that')
  return { family, access }
}
