import { getTree } from '../../../services/family.service'

export default defineApi(async event => getTree(await useDb(), param(event, 'slug'), await viewerOf(event)))
