# Shift Left

Learn the basics of QA testing by poking at it. Every idea is a 3D scene you can change, and every lesson ends with real tests against **Kudi**, a small fintech app with bugs planted on purpose.

Built for a small circle learning QA or moving into QA roles. Lessons are tagged with ISTQB CTFL v4.0 learning objectives.

## Quick start

Needs **Node 22.13+** (Kudi uses Node's built-in SQLite) and **pnpm** (`corepack enable`).

```bash
pnpm install
npx playwright install chromium   # once, for browser tests

pnpm dev        # learning site → http://localhost:3000
pnpm kudi       # Kudi app      → http://localhost:5173 (API on :8787)
```

Then try the first exercise:

```bash
pnpm exercise 02-boundaries            # your tests, with Kudi's planted bug ON
pnpm exercise 02-boundaries --fixed    # same tests, bug OFF
```

## What's here

```
apps/
  site/        Next.js learning site: lesson player, course tree
  kudi/        The app under test: React UI + Hono API + SQLite. SPEC.md is the oracle.
packages/
  ui/          Design tokens and UI kit (Button, Chip, Metric, StepRail, Toggle…)
  iso/         Isometric 3D pieces (IsoBox, Server, Pipe, Label, BlockRow, Pyramid…)
  sim/         Pure simulations behind each scene: run(model, tests) → results
  lessons/     Course outline (with CTFL tags) and lessons as typed data
exercises/
  02-boundaries/          Partitions and boundaries
  03-decision-tables/     Decision tables (fees)
  04-state-transitions/   State transitions (card)
  05-coverage/            Statement and branch coverage (Vitest + coverage report)
scripts/
  exercise.mjs     Runs an exercise against a fresh Kudi with its bug on or off
```

**Component first:** nothing is built inside a page. Simulation → 3D piece → scene → lesson, each tested before the next layer uses it.

## Planted bugs

Kudi runs correctly by default. Bugs are switched on by name:

```bash
KUDI_BUGS=limit-exclusive pnpm kudi
```

| Bug | Lesson | What it does |
| --- | --- | --- |
| `limit-exclusive` | Partitions and boundaries | Maximum uses `<` instead of `<=`, so exactly ₦500,000 is rejected |
| `fee-express-first` | Decision tables | Fee rules check express before tier, so Plus express costs ₦100, not ₦50 |
| `card-unblock` | State transitions | Unfreeze only checks "not active", so a blocked card can be reactivated |
| `cashback-basic-undefined` | Statement and branch coverage | `rate` is never initialised, so Basic customers get NaN cashback |

The list lives in `apps/kudi/src/bugs.ts`. Exercises turn their bug on for you.

## Tests (we practise what we teach)

```bash
pnpm test        # unit + component + API tests, every package
pnpm typecheck
pnpm e2e         # browser tests for the site and for Kudi
```

| Where | Kind | Tool |
| --- | --- | --- |
| `packages/sim`, `packages/lessons`, `apps/kudi/src/domain` | Unit | Vitest |
| `packages/ui`, `packages/iso`, `apps/kudi/src/web` | Component | Vitest + Testing Library |
| `apps/kudi/src/server` | API (in-memory DB) | Vitest + `app.request` |
| `apps/site/e2e`, `apps/kudi/e2e` | End to end | Playwright |

## Writing a lesson

A lesson is a data file in `packages/lessons/src/lessons/`. Each step sets the scene's state, its text, an optional goal or prediction that unlocks Next, and a Go deeper section. Register it in `src/index.ts` and mark it `built: true` in `course.ts`.

A new **kind** of scene needs: a pure simulation in `packages/sim`, an evaluator in `packages/lessons/src/evaluate.ts`, and a view + controls + metrics in `apps/site/components/scenes/`.

## Status

Phase 1 in progress: 3 playable lessons (Partitions and boundaries, Decision tables, State transitions), each with a Kudi feature, a planted bug and an exercise. Next: the rest of Module 2, then Module 1.
