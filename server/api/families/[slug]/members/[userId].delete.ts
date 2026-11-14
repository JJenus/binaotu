import { removeMember } from '../../../../services/sharing.service'

export default defineApi(async (event) => {
  await removeMember(await useDb(), param(event, 'slug'), param(event, 'userId'), await viewerOf(event))
  return { ok: true }
})
