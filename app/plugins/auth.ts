// Loads the current user once per visit. On the server we only ask when a session cookie exists.
export default defineNuxtPlugin(async () => {
  const auth = useAuth()
  if (auth.user.value !== undefined) return
  if (import.meta.server && !useRequestHeaders(['cookie']).cookie?.includes('binaotu=')) {
    auth.user.value = null
    return
  }
  await auth.refresh()
})
