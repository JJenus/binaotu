# Binaotu — Plan & Features

Binaotu is a family-tree web app. People find a family by name, open its tree,
browse it by generation and year range, and grow it by adding relatives.
Relationships are **derived**, never typed in: you add someone *relative to a
person* and the system links siblings, aunts, uncles and cousins itself.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Nuxt 4 (Vue 3, TypeScript) | One codebase, SSR + API |
| API | Nitro routes in `server/api` | Thin handlers, no separate service yet |
| DB | PostgreSQL via Drizzle ORM | Real SQL; PGlite (in-process Postgres) is used when `DATABASE_URL` is unset, so dev and tests need no setup |
| Validation | Zod, shared by server and client | One schema, one source of truth |
| Tests | Vitest | The kinship engine is pure and fully unit-tested |

The domain logic lives in `shared/kinship` as pure TypeScript with no framework
imports, so it can be ported to Spring Boot later without redesign.

## Architecture

```
shared/                 pure, framework-free, imported by server AND app
  types/                DTOs and enums
  kinship/              Graph, relate(), planAddRelative(), buildTiers()
server/
  db/                   schema, client (pg or PGlite), migrations
  repositories/         SQL only
  services/             use-cases: orchestrate repo + kinship, own transactions
  api/                  thin handlers: validate -> service -> respond
  utils/                error mapping, validation helper
app/
  api/                  API implementation: one typed function per endpoint
  composables/          state + behaviour; the ONLY layer that calls app/api
  components/           presentation only; talk to composables, never to $fetch
  pages/                routes, compose components
```

### Front-end rule: implementation vs usage

1. `app/api/*` is the only place that knows URLs, HTTP verbs and payload shapes.
2. `app/composables/*` call `app/api/*` and expose reactive state and actions.
3. Components and pages import composables. They never import `app/api` or call
   `$fetch`/`useFetch` themselves.
4. Swapping the transport (REST to RPC, Nuxt to Spring Boot) touches `app/api`
   and nothing else.

## Data model

Only facts are stored. Siblings, aunts, uncles, cousins are computed.

- `family` — id, slug, name, description, visibility
- `person` — id, family_id, given_name, family_name, sex, birth_year, death_year,
  birth_place, notes, is_placeholder
- `parent_link` — child_id, parent_id, kind (`biological` | `adoptive` | `step`)
- `union` — id, family_id, partner_a_id, partner_b_id, kind, start_year, end_year

A placeholder person ("Unknown parent") keeps the graph connected when a
relative is added before their parents are known. It can be filled in later.

## Auto-link rules

Every add happens relative to an existing person (the anchor).

| Adding | Needs | The system does |
|---|---|---|
| Child | anchor; other parent optional | links child to anchor (and other parent) |
| Parent | anchor | links parent; max two parents per person |
| Partner | anchor | creates a union |
| Sibling | anchor; `full` or `half` (+ which parent) | reuses the anchor's parents; creates placeholder parents if none |
| Aunt/uncle | which parent | sibling of that parent |
| Nephew/niece | which sibling | child of that sibling |
| Cousin | which aunt/uncle | child of that aunt/uncle |
| Grandparent | which parent | parent of that parent |
| Grandchild | which child | child of that child |

Composite relations are built from four primitives (parent, child, partner,
sibling), so there is one implementation of each rule.

## Features

### Phase 1 — Core (current)
- [x] Plan and project scaffold
- [x] Database schema, migrations, PGlite/Postgres client
- [x] Kinship engine: graph, relationship labels, auto-link planner, tiers
- [x] API: search/create family, load tree, add relative, relationship between two people
- [ ] Front API layer + composables
- [ ] Pages: search home, create family, family tree (ring and grid views)
- [ ] Add-relative flow with auto-link

### Phase 2 — Browse
- [ ] Generation filter and direct jump
- [ ] Birth-year range slider (dims people outside the range)
- [ ] "How are we related?" between any two people
- [ ] Person profile: bio, places, partial dates

### Phase 3 — Edit and quality
- [ ] Edit and delete person (with link repair)
- [ ] Duplicate detection and merge
- [ ] Photo upload, GEDCOM import/export
- [ ] Audit log

### Phase 4 — Accounts and privacy
- [ ] Sign-in; owner, editor, viewer roles; invite links
- [ ] Living-person privacy, edit suggestions with approval

## Conventions
- One commit per feature, conventional messages (`feat:`, `fix:`, `chore:`, `docs:`).
- No placeholders in code: each commit builds and its tests pass.
