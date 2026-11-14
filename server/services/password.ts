import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'

const scrypt = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) =>
  scryptCb(password, salt, 64, (err, key) => err ? reject(err) : resolve(key)))

/** `scrypt:<salt>:<key>`, both base64. Memory-hard, built into Node, no dependency. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  return `scrypt:${salt.toString('base64')}:${(await scrypt(password, salt)).toString('base64')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, salt, key] = stored.split(':')
  if (alg !== 'scrypt' || !salt || !key) return false
  const expected = Buffer.from(key, 'base64')
  const actual = await scrypt(password, Buffer.from(salt, 'base64'))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
