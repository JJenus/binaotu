import { currentUser } from '../../services/auth.service'

/** The signed-in user, or null. A session pointing at a deleted account is cleared. */
export default defineApi(async (event) => {
  const { userId } = await viewerOf(event)
  if (!userId) return null
  const user = await currentUser(await useDb(), userId)
  if (!user) await signOut(event)
  return user ?? null
})
