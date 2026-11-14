import { loginSchema } from '../../../shared/schemas'
import { login } from '../../services/auth.service'

export default defineApi(async (event) => {
  const input = await parseBody(event, loginSchema)
  loginLimit(`${clientIp(event)}:${input.email}`)
  const user = await login(await useDb(), input)
  await signIn(event, user.id)
  return user
})
