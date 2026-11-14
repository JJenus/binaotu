import { and, eq, sql } from 'drizzle-orm'
import type { Db } from '../db/client'
import { familyMembers, invites, users } from '../db/schema'
import type { InviteDTO, MemberDTO, Role } from '../../shared/types'

export async function roleOf(db: Db, familyId: string, userId: string): Promise<Role | null> {
  const [row] = await db.select({ role: familyMembers.role }).from(familyMembers)
    .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId))).limit(1)
  return row?.role ?? null
}

export async function setMember(db: Db, familyId: string, userId: string, role: Role): Promise<void> {
  await db.insert(familyMembers).values({ familyId, userId, role })
    .onConflictDoUpdate({ target: [familyMembers.familyId, familyMembers.userId], set: { role } })
}

export async function removeMember(db: Db, familyId: string, userId: string): Promise<void> {
  await db.delete(familyMembers).where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId)))
}

export async function listMembers(db: Db, familyId: string): Promise<MemberDTO[]> {
  return db.select({ userId: users.id, name: users.name, email: users.email, role: familyMembers.role })
    .from(familyMembers).innerJoin(users, eq(familyMembers.userId, users.id)).where(eq(familyMembers.familyId, familyId)).orderBy(familyMembers.createdAt)
}

export async function countOwners(db: Db, familyId: string): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(familyMembers).where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.role, 'owner')))
  return row!.n
}

const toInvite = (r: { token: string, role: Role, expiresAt: Date }): InviteDTO => ({ token: r.token, role: r.role, expiresAt: r.expiresAt.toISOString() })

export async function insertInvite(db: Db, v: { familyId: string, token: string, role: Role, expiresAt: Date }): Promise<InviteDTO> {
  const [row] = await db.insert(invites).values(v).returning({ token: invites.token, role: invites.role, expiresAt: invites.expiresAt })
  return toInvite(row!)
}

export async function activeInvites(db: Db, familyId: string): Promise<InviteDTO[]> {
  const rows = await db.select({ token: invites.token, role: invites.role, expiresAt: invites.expiresAt }).from(invites)
    .where(and(eq(invites.familyId, familyId), sql`${invites.expiresAt} > now()`)).orderBy(invites.createdAt)
  return rows.map(toInvite)
}

export async function findInvite(db: Db, token: string) {
  const [row] = await db.select({ familyId: invites.familyId, role: invites.role, expiresAt: invites.expiresAt }).from(invites)
    .where(and(eq(invites.token, token), sql`${invites.expiresAt} > now()`)).limit(1)
  return row
}

export async function deleteInvite(db: Db, familyId: string, token: string): Promise<void> {
  await db.delete(invites).where(and(eq(invites.familyId, familyId), eq(invites.token, token)))
}
