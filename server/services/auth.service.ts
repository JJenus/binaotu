import type { Db } from '../db/client'
import * as userRepo from '../repositories/user.repo'
import type { LoginInput, RegisterInput } from '../../shared/schemas'
import type { UserDTO } from '../../shared/types'
import { AppError } from './errors'
import { hashPassword, verifyPassword } from './password'

// Verified against when the email is unknown, so "no such user" costs the same time as "wrong password".
const decoy = hashPassword('decoy-password-for-timing')

export async function register(db: Db, input: RegisterInput): Promise<UserDTO> {
  const email = input.email.trim().toLowerCase()
  if (await userRepo.findCredentials(db, email)) throw new AppError(409, 'An account with that email already exists')
  return userRepo.insertUser(db, { email, name: input.name.trim(), passwordHash: await hashPassword(input.password) })
}

export async function login(db: Db, input: LoginInput): Promise<UserDTO> {
  const found = await userRepo.findCredentials(db, input.email.trim().toLowerCase())
  const ok = await verifyPassword(input.password, found?.passwordHash ?? await decoy)
  if (!found || !ok) throw new AppError(401, 'Email or password is incorrect')
  return { id: found.id, name: found.name, email: found.email }
}

export const currentUser = (db: Db, id: string) => userRepo.findById(db, id)
