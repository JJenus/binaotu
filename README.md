# Binaotu

Family-tree web app built with Nuxt 4. See [docs/PLAN.md](docs/PLAN.md) for the plan, architecture and feature list.

```bash
npm install
npm run dev        # http://localhost:3000, seeded with a sample family; uses embedded PGlite when DATABASE_URL is unset
npm test           # kinship engine, database, services, layout maths
npm run build      # production build; set DATABASE_URL to a Postgres instance
```

Copy `.env.example` to `.env` to use your own Postgres.
