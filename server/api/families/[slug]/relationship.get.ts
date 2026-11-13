import { relationshipQuerySchema } from '../../../../shared/schemas'
import { relationship } from '../../../services/family.service'

export default defineApi(async (event) => {
  const { a, b } = parseQuery(event, relationshipQuerySchema)
  return relationship(await useDb(), param(event, 'slug'), a, b)
})
