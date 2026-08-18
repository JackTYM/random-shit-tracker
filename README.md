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

The R2 bucket (`randomshittracker-images`) also needs a CORS policy configured before browser-based photo uploads will work — without it, uploads fail silently in the browser (they still succeed via `curl`, since curl doesn't enforce CORS, which is what makes this easy to miss). This is set via the Cloudflare dashboard → R2 → bucket → Settings → CORS Policy, not via code or a migration, since R2 bucket configuration lives outside this repo. The policy live in production:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://randomshittracker.com", "https://www.randomshittracker.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

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

Phase 1 (foundation — auth, schema, R2 upload path, header shell) and Phase 2a (Add Item — create an item in any of the 6 categories, with photos, via `/items/new`) are complete. Browse, Item Detail, and cross-item linking (Phase 2b), plus Dashboard, Storage, and Search (Phase 2c), are still to come.

For full detail, see:
- `docs/superpowers/specs/2026-08-16-phase1-foundation-design.md`
- `docs/superpowers/plans/2026-08-16-phase1-foundation.md`
- `docs/superpowers/specs/2026-08-17-phase2a-data-layer-add-item-design.md`
- `docs/superpowers/plans/2026-08-18-phase2a-data-layer-add-item.md`
