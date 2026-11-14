import { afterAll, describe, expect, it } from 'vitest'
import { createTestDb } from '../db/testing'
import { currentUser, login, register } from './auth.service'
import { hashPassword, verifyPassword } from './password'

describe('passwords', () => {
  it('verifies the right password and rejects others, with a different salt each time', async () => {
    const a = await hashPassword('correct horse'), b = await hashPassword('correct horse')
    expect(a).not.toBe(b)
    expect(await verifyPassword('correct horse', a)).toBe(true)
    expect(await verifyPassword('wrong', a)).toBe(false)
    expect(await verifyPassword('x', 'garbage')).toBe(false)
  })
})

describe('auth service', async () => {
  const { db, close } = await createTestDb()
  afterAll(close)

  it('registers, never returns the hash, and normalises the email', async () => {
    const user = await register(db, { name: ' Ada ', email: 'Ada@Example.COM', password: 'password123' })
    expect(user).toEqual({ id: expect.any(String), name: 'Ada', email: 'ada@example.com' })
    expect(await currentUser(db, user.id)).toEqual(user)
  })

  it('rejects a duplicate email in any letter case', async () => {
    await expect(register(db, { name: 'Other', email: 'ADA@example.com', password: 'password123' })).rejects.toMatchObject({ status: 409 })
  })

  it('logs in with the right password only', async () => {
    expect(await login(db, { email: 'ada@example.com', password: 'password123' })).toMatchObject({ name: 'Ada' })
    await expect(login(db, { email: 'ada@example.com', password: 'nope' })).rejects.toMatchObject({ status: 401 })
    await expect(login(db, { email: 'ghost@example.com', password: 'password123' })).rejects.toMatchObject({ status: 401 })
  })
})
