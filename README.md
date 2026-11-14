# Binaotu

Family-tree web app built with Nuxt 4. Uses [pnpm](https://pnpm.io). See [docs/PLAN.md](docs/PLAN.md) for the plan, architecture and feature list.

```bash
pnpm install
pnpm dev            # http://localhost:3000, seeded with a sample family; uses embedded PGlite when DATABASE_URL is unset
pnpm test           # kinship engine, database, services, layout maths
pnpm build        # production build; set DATABASE_URL to a Postgres instance
```

Copy `.env.example` to `.env` to use your own Postgres. In production you must also set `NUXT_SESSION_PASSWORD`.

In development the app seeds a sample family and a demo account: `demo@binaotu.local` / `demo-password` (owner of the sample family).

## Access model

- Anyone can search public families and view their trees. People presumed living (no death year, born in the last 100 years or unknown) are shown as "Living relative" with no name, dates, place or notes.
- Signed-in members see everyone. Roles: **owner** (manages members and invites), **editor** (adds, edits, removes people), **viewer** (read only).
- Owners create invite links (7 days, editor or viewer). Private families are invisible to non-members.
