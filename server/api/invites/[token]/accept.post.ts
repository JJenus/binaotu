import { acceptInvite } from '../../../services/sharing.service'

export default defineApi(async event => acceptInvite(await useDb(), param(event, 'token'), await requireUser(event)))
