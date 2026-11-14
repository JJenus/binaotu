import { personInputSchema } from '../../../../../../shared/schemas'
import { updatePerson } from '../../../../../services/family.service'

export default defineApi(async event => updatePerson(await useDb(), param(event, 'slug'), param(event, 'id'), await parseBody(event, personInputSchema)))
