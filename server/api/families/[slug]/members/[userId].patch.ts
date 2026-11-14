import { memberRoleSchema } from '../../../../../shared/schemas'
import { setMemberRole } from '../../../../services/sharing.service'

export default defineApi(async event => setMemberRole(await useDb(), param(event, 'slug'), param(event, 'userId'), (await parseBody(event, memberRoleSchema)).role, await viewerOf(event)))
