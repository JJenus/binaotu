import { searchFamiliesSchema } from '../../../shared/schemas'
import { searchFamilies } from '../../services/family.service'

export default defineApi(async (event) => searchFamilies(await useDb(), parseQuery(event, searchFamiliesSchema).q))
