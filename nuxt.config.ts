import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: { databaseUrl: process.env.DATABASE_URL || '' },
  nitro: {
    serverAssets: [{ baseName: 'migrations', dir: fileURLToPath(new URL('./server/db/migrations', import.meta.url)) }]
  }
})
