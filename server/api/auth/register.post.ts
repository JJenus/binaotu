import { registerSchema } from '../../../shared/schemas'
import { register } from '../../services/auth.service'

export default defineApi(async (event) => {
  registerLimit(clientIp(event))
  const user = await register(await useDb(), await parseBody(event, registerSchema))
  await signIn(event, user.id)
  setResponseStatus(event, 201)
  return user
})
