export default defineApi(async (event) => {
  await signOut(event)
  return { ok: true }
})
