import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Binaotu — family trees',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap' }
      ]
    }
  },
  runtimeConfig: { databaseUrl: process.env.DATABASE_URL || '' },
  nitro: {
    serverAssets: [{ baseName: 'migrations', dir: fileURLToPath(new URL('./server/db/migrations', import.meta.url)) }]
  }
})
