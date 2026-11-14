import { listMembers } from '../../../services/sharing.service'

export default defineApi(async event => listMembers(await useDb(), param(event, 'slug'), await viewerOf(event)))
