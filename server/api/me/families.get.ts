import { myFamilies } from '../../services/family.service'

export default defineApi(async event => myFamilies(await useDb(), await requireUser(event)))
