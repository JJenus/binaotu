import { countFamilies } from '../repositories/family.repo'
import { seedDemoFamily } from '../services/demo.service'

// Development convenience: start with one sample family so the app is never empty.
export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return
  const db = await useDb()
  if (await countFamilies(db) === 0) await seedDemoFamily(db)
})
