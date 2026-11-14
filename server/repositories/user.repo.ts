import { eq } from 'drizzle-orm'
import type { Db } from '../db/client'
import { users } from '../db/schema'
import type { UserDTO } from '../../shared/types'

const userColumns = { id: users.id, name: users.name, email: users.email }

export async function findById(db: Db, id: string): Promise<UserDTO | undefined> {
  const [row] = await db.select(userColumns).from(users).where(eq(users.id, id)).limit(1)
  return row
}

export async function findCredentials(db: Db, email: string) {
  const [row] = await db.select({ ...userColumns, passwordHash: users.passwordHash }).from(users).where(eq(users.email, email)).limit(1)
  return row
}

export async function insertUser(db: Db, v: { email: string, name: string, passwordHash: string }): Promise<UserDTO> {
  const [row] = await db.insert(users).values(v).returning(userColumns)
  return row!
}
