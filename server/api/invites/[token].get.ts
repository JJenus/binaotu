import { previewInvite } from '../../services/sharing.service'

export default defineApi(async event => previewInvite(await useDb(), param(event, 'token')))
