# Plan: Update README local dev section + start server

## Context
The README has a minimal "Local dev" section with only 3 lines. Herbert wants full instructions
on how to run the site locally — all commands, what they do, and which to use when.

## Changes

### File: `/home/herbert/Projects/data-setpiecetakers/README.md`

Replace the existing sparse "Local dev" section with an expanded version covering:

1. **Prerequisites** — Node.js, npm
2. **Setup** — clone, install, env vars
3. **Run dev server** — `npm run dev` → localhost:3000 (hot reload, reads from live Supabase)
4. **Preview Cloudflare Pages build** — `npm run preview` → Cloudflare Pages local emulation
5. **Build only** — `npm run build` for static output check
6. **Lint** — `npm run lint`

### Available scripts (from package.json)
| Command | What it does |
|---------|-------------|
| `npm run dev` | Next.js dev server at localhost:3000, hot reload |
| `npm run build` | Production build (Next.js static output) |
| `npm start` | Serve production build locally |
| `npm run pages:build` | Build for Cloudflare Pages via @cloudflare/next-on-pages |
| `npm run preview` | Build + serve Cloudflare Pages locally via wrangler |
| `npm run lint` | ESLint check |

## After writing README
Start dev server in background: `cd /home/herbert/Projects/data-setpiecetakers && nohup npm run dev > /tmp/next-dev.log 2>&1 &`

## Verification
- README contains all commands with descriptions
- `curl http://localhost:3000` returns 200
