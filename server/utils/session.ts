import type { H3Event } from 'h3'
import { AppError } from '../services/errors'
import type { Viewer } from '../services/access.service'

const DEV_PASSWORD = 'development-only-session-password-change-me'

async function session(event: H3Event) {
  const configured = useRuntimeConfig(event).sessionPassword as string
  if (!configured && !import.meta.dev) throw new Error('Set NUXT_SESSION_PASSWORD to a random string of at least 32 characters')
  const password = configured || DEV_PASSWORD
  if (password.length < 32) throw new Error('NUXT_SESSION_PASSWORD must be at least 32 characters')
  return useSession<{ userId?: string }>(event, {
    password, name: 'binaotu', maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, path: '/' }
  })
}

export async function viewerOf(event: H3Event): Promise<Viewer> {
  return { userId: (await session(event)).data.userId ?? null }
}

export async function requireUser(event: H3Event): Promise<string> {
  const { userId } = await viewerOf(event)
  if (!userId) throw new AppError(401, 'Sign in to do that')
  return userId
}

export async function signIn(event: H3Event, userId: string) { await (await session(event)).update({ userId }) }
export async function signOut(event: H3Event) { await (await session(event)).clear() }
