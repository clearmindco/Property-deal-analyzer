# Property Deal Analyzer

From address to answer. Understand the deal. Know the risk. Know your next move.

A real-estate investor command center: analyze, finance, and decide on a deal without
needing to know professional underwriting terminology first -- while the calculations
underneath are investor-grade. See `STATUS.md` for what's built vs. what's next.

## Stack

- Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS
- Prisma + SQLite for the MVP (swap `DATABASE_URL` to Postgres/Supabase later -- see note below)
- NextAuth (credentials provider) for auth; every Deal/Lender/Lead/Contact row is scoped by `userId`
- Vitest for the calculation engine's unit tests

## Getting started

```bash
npm install
cp .env.example .env      # then set NEXTAUTH_SECRET to a random value
npm run db:generate
npm run db:push
npm run db:seed           # creates a demo login + one DEMO/EDUCATIONAL deal
npm run dev
```

Demo login (created by `npm run db:seed`): `demo@propertydealanalyzer.com` / `demodemo123`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Next.js/ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the calculation-engine unit tests (Vitest) |
| `npm run db:seed` | Create the demo user + demo deal |

## Architecture notes

- **Calculations are deterministic TypeScript, not AI.** Everything in `src/lib/calc/*`
  (mortgage math, LTV/LTC, DSCR, NOI, cap rate, cash-on-cash, hard-money loan sizing,
  refinance proceeds, the acquisition-price solver, the stress test, lender comparison,
  and the decision engine) is pure, unit-tested TypeScript. AI is only used to explain,
  extract, or summarize numbers the calc engine already produced -- never to calculate them.
- **AI provider is abstracted** behind `src/lib/ai/provider.ts` / `AiProvider`. The MVP ships
  a zero-dependency heuristic provider (`heuristicProvider.ts`) so the product works with no
  external AI key. Swap in a real model behind the same interface later.
- **JSON fields on SQLite.** Prisma's SQLite connector has no native `Json` column type, so
  structured blobs (property condition, ARV, rehab, rent, financing, lender terms, etc.) are
  stored as TEXT and serialized/deserialized at the boundary in `src/lib/jsonFields.ts`. Moving
  to Postgres later can drop that layer and use Prisma's native `Json` type directly.
- **Voice input** uses the browser's built-in Web Speech API (Chrome/Edge) -- no external
  speech-to-text key required. See `src/components/ui/VoiceInput.tsx`.
- **Simple vs. Pro mode** never changes a calculation, only terminology/explanation density.
  See `src/lib/terminology.ts` and `src/lib/mode-context.tsx`.

## Known limitation

`npm audit` reports several Next.js advisories that are only patched in the Next 15 line
(the app is pinned to the latest Next **14.2.x** patch, which does close the critical
middleware authorization-bypass CVE that mattered most given this app's use of
`next-auth/middleware`). Upgrading to Next 15 is a larger, breaking change intentionally
left out of this MVP pass -- do that before any real production deployment.
