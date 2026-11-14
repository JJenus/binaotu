import { revokeInvite } from '../../../../services/sharing.service'

export default defineApi(async (event) => {
  await revokeInvite(await useDb(), param(event, 'slug'), param(event, 'token'), await viewerOf(event))
  return { ok: true }
})
