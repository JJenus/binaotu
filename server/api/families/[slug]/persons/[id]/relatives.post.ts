import { addRelativeSchema } from '../../../../../../shared/schemas'
import { addRelative } from '../../../../../services/family.service'

export default defineApi(async (event) => {
  setResponseStatus(event, 201)
  return addRelative(await useDb(), param(event, 'slug'), param(event, 'id'), await parseBody(event, addRelativeSchema))
})
