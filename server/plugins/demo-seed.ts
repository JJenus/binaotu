import { countFamilies } from '../repositories/family.repo'
import { findCredentials } from '../repositories/user.repo'
import { register } from '../services/auth.service'
import { seedDemoFamily } from '../services/demo.service'

const DEMO = { name: 'Demo Owner', email: 'demo@binaotu.local', password: 'demo-password' }

// Development convenience: one sample family and a demo account that owns it.
export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return
  const db = await useDb()
  if (await countFamilies(db) > 0) return
  const owner = await findCredentials(db, DEMO.email) ?? await register(db, DEMO)
  await seedDemoFamily(db, owner.id)
  console.info(`[demo] Sample family seeded. Sign in as ${DEMO.email} / ${DEMO.password}`)
})
