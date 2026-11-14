import { createFamilySchema } from '../../../shared/schemas'
import { createFamily } from '../../services/family.service'

export default defineApi(async (event) => {
  const userId = await requireUser(event)
  setResponseStatus(event, 201)
  return createFamily(await useDb(), await parseBody(event, createFamilySchema), userId)
})
