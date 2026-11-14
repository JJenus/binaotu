import { inviteSchema } from '../../../../shared/schemas'
import { createInvite } from '../../../services/sharing.service'

export default defineApi(async (event) => {
  const viewer = await viewerOf(event)
  setResponseStatus(event, 201)
  return createInvite(await useDb(), param(event, 'slug'), (await parseBody(event, inviteSchema)).role, viewer)
})
