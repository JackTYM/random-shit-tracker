# RandomShitTracker.com

A personal collection tracker for rocket motors, model kits, model airplanes, parts, printed material, and other collectables.

## Stack

- [Nuxt 4](https://nuxt.com)
- Cloudflare Workers (Nitro `cloudflare_module` preset)
- Neon Postgres (Data API + Neon Auth)
- Cloudflare R2 (image storage)

## Setup

```bash
npm install
```

Copy the env templates and fill in the blanks:

```bash
cp .env.example .env               # used by npm run dev
cp .dev.vars.example .dev.vars     # used by npx wrangler dev
```

Both files have blank R2 credential lines (`NUXT_R2_ACCESS_KEY_ID`, `NUXT_R2_SECRET_ACCESS_KEY`) that need to be filled in by hand. Never commit real values to either file.

## Database migrations

```bash
npx drizzle-kit generate   # create a migration from schema changes
npx drizzle-kit migrate    # apply migrations to the live Neon database
```

`drizzle-kit migrate` requires `DATABASE_URL_UNPOOLED` set in `.env` — the *direct*, non-pooled Neon connection string. RLS-policy migrations require the direct connection.

## Scripts

```bash
npm run dev         # Nuxt dev server
npm run build       # production build
npm run typecheck   # tsc -b (npm run build does not type-check — Vite/esbuild strips types without checking)
npx wrangler dev     # test the actual Cloudflare Workers build locally
```

## Status

Phase 1 (foundation — auth, schema, R2 upload path, header shell) is complete. There are no category pages yet; dashboard, browse, detail, add, storage, and search are Phase 2.

For full detail, see:
- `docs/superpowers/specs/2026-08-16-phase1-foundation-design.md`
- `docs/superpowers/plans/2026-08-16-phase1-foundation.md`
