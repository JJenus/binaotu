import { removePerson } from '../../../../../services/family.service'

export default defineApi(async event => removePerson(await useDb(), param(event, 'slug'), param(event, 'id')))
