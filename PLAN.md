# Day 031 — Sales Forecast Playground — Implementation Plan

> This file is the contract. It was settled before any code was written, through a
> structured grilling session, and it is not a starting point to improve on. If the
> code contradicts this file, the code is wrong. If this file needs to change, it
> changes here first, in writing, with the reason.

**Repo:** `sales-forecast-playground` · **Day:** 031 of 100 · **Time limit:** one session (~2-4 hrs)
**Brief (fixed by the master plan):** *An interactive environment for exploring pipeline
and forecast assumptions.*
**Portfolio angle:** Forecasting, scenario analysis, business visualization.

---

## Problem

A sales forecast number is only as good as the assumptions behind it, and those
assumptions are usually invisible. A rep's self-reported probability, how much deals
typically slip past their close date, whether the team is known to sandbag or
oversell — none of that is visible in a single static forecast total. Nobody can see
*how sensitive* the number is to any one assumption, so forecast conversations become
arguments about a single opaque figure instead of an inspection of the inputs that
produced it.

### What this repo is not

- **Not a reverse-funnel planner.** Day 027 Pipeline Calculator already owns
  goal-down math (revenue target → required activity/conversion assumptions). This
  repo goes the other direction: it starts from an existing pipeline and asks "what
  does this pipeline forecast to, under these assumptions" — bottom-up, not top-down.
- **Not a stall/risk scorer.** Day 022 Pipeline Inspector owns "is this deal stalled
  or risky." This repo never flags individual deals as risky; it only recomputes
  aggregate forecast totals as assumptions change.
- **Not connected to any other day's code.** Standalone repo, no shared module.
- **Not a live CRM integration.** A committed synthetic corpus, seeded and
  reproducible — ships in one session, zero OAuth setup, the forecast math is the
  point, not the data source.
- **Not a Monte Carlo simulator.** Deterministic recompute per slider change, not a
  probabilistic trial run. Faster to build, faster to reason about, and the
  quarter-boundary slippage effect is visual enough on its own.
- **No CSV upload, no saved/named scenario comparison, no per-rep sandbagging, no
  4th "next quarter" total.** Cut for time; listed under Post-MVP below.

---

## Intended user

A sales manager, RevOps lead, or forecast owner who wants to see how much a
quarter's forecast number depends on assumptions nobody usually questions —
by dragging them and watching the number move.

## User journey

1. Land on the page: 4 pipeline stages, ~200 open deals, forecast already computed
   under default assumptions.
2. See 3 headline numbers: Best Case, Commit, Weighted — for the current quarter.
3. Drag any of 6 inputs (4 per-stage win-rate overrides, slippage weeks, sandbagging
   correction) and watch all 3 numbers, the deal table, and the sensitivity chart
   recompute live.
4. Read the deal-level table to see exactly which deals are driving which category,
   and which deals have slipped out of the quarter.
5. Copy the URL to share the exact scenario (assumptions are query-param encoded).

---

## User-selected MVP scope

- Weighted-pipeline forecast simulator over a synthetic open pipeline.
- 3 headline forecast categories (Best Case / Commit / Weighted), recomputed live.
- 6 adjustable inputs: 4× per-stage win-rate override, slippage (weeks), sandbagging
  correction (multiplier).
- 1 sensitivity chart: Weighted total vs. slippage-weeks, other 2 levers held at
  current value.
- Sortable deal-level table, no filtering.
- Scenario state encoded in URL query params (shareable link).

## User-selected stack

Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript + vitest — matches every prior
day's repo. Standalone, no dependency on other days' code. No chart library — the
one sensitivity chart and the 3 headline bars are custom SVG/Tailwind.

## User-selected data sources

Synthetic, seeded, reproducible corpus — generated once by a script, committed as
JSON. No live CRM connection.

## User-selected time limit

One session, ~2-4 hours.

## User-selected deployment target

Vercel. GitHub repo `akshatiwarix/sales-forecast-playground`, public.

---

## System / architecture plan

- `lib/generate-deals.ts` — deterministic seeded generator, run once via a script,
  output committed to `data/deals.json`. Not regenerated at build or request time.
- `lib/forecast.ts` — pure functions: `effectiveProbability(deal, assumptions)`,
  `applySlippage(deal, weeks)`, `isInQuarter(deal, referenceDate)`,
  `computeForecast(deals, assumptions)` → `{ bestCase, commit, weighted }`,
  `computeSensitivity(deals, assumptions)` → points for the slippage-vs-weighted
  curve. These are the functions vitest covers.
- `app/page.tsx` — client component: reads assumptions from URL query params
  (falls back to defaults), renders sliders, headline cards, sensitivity chart,
  deal table. Every slider change updates the query string (shareable link) and
  triggers a live recompute via the `lib/forecast.ts` functions — no server
  round-trip, no API route needed.
- No backend/API routes, no database. Everything is a client-side pure-function
  recompute over the committed JSON.

## Data model

Each deal (`data/deals.json`):

```ts
type Deal = {
  id: string;
  account: string;
  owner: string; // rep name
  amount: number;
  stage: "Prospecting" | "Qualification" | "Proposal" | "Negotiation";
  stageEnteredDate: string; // ISO date
  expectedCloseDate: string; // ISO date
  repProbability: number; // 0-1, rep-entered
};
```

Reference "today" and quarter boundaries are constants baked into the generator
(not `Date.now()`), so the demo stays stable regardless of when it's viewed.
Deals span the current + next quarter's close dates so the slippage lever has a
visible quarter-boundary effect.

Assumptions (`lib/forecast.ts` input, URL-encoded):

```ts
type Assumptions = {
  stageWinRate: Partial<Record<Deal["stage"], number>>; // override, 0-1
  slippageWeeks: number;
  sandbaggingCorrection: number; // multiplier, e.g. 0.5-1.5
};
```

## Main states and workflows

- **Default state**: no query params → default assumptions (no stage overrides,
  0 slippage weeks, 1.0x sandbagging correction) → forecast = straight rep-reported
  weighted pipeline.
- **Adjusted state**: any query param present → that assumption overrides the
  default → all 3 headline numbers, table, and chart recompute.
- **Slipped-out deal**: a deal whose close date + slippage weeks crosses the
  quarter boundary → excluded from headline totals, shown in table with a
  "moved to next quarter" badge.
- **Empty/failure states**: none expected — dataset is static and always present;
  no network calls to fail.

## Implementation task order

1. Scaffold Next.js app (match stage-validator's package.json versions), Tailwind,
   TypeScript, vitest, eslint. Init git, first commit, push.
2. This PLAN.md (contract), committed before implementation code. Push.
3. `lib/generate-deals.ts` seeded generator + run once → `data/deals.json`. Commit,
   push.
4. `lib/forecast.ts` pure functions + vitest unit tests (effective probability,
   slippage/quarter cutoff, category totals, sensitivity points). Commit, push.
5. `app/page.tsx` UI: headline cards, 6 sliders, sortable table, sensitivity chart,
   URL query param sync. Commit, push.
6. README.md per master template. Commit, push.
7. Deploy to Vercel, verify live URL. Commit any deploy config if needed, push.

## Validation / test plan

- vitest unit tests on every pure function in `lib/forecast.ts`: default-assumption
  baseline, stage override replacing rep probability, sandbagging correction math,
  slippage crossing the quarter boundary, Commit threshold (0.7) edge case.
- Manual pass in browser: drag each of the 6 inputs individually, confirm all 3
  headline numbers and the table update; confirm a shared URL reproduces the exact
  same scenario on reload.

## Deployment plan

`vercel deploy` (preview), then promote to production once the manual pass is
clean. No environment variables needed — fully static data, no secrets.

## README plan

Follow the master plan's Reusable README Structure. Key Decisions & Tradeoffs
section covers: deterministic vs. Monte Carlo, why Commit threshold is a fixed
constant and not a 7th slider, why closed deals are excluded from the dataset.

## Definition of done

- All 6 inputs live-recompute all 3 headline numbers, the table, and the chart.
- URL query params round-trip a scenario exactly.
- vitest suite passes.
- Deployed to Vercel, live URL works.
- README.md complete per template.
- Progress tracker in the master plan file updated to `[x]` for Day 031.

## Post-MVP ideas (not built now)

- CSV upload of a real pipeline instead of/alongside the synthetic corpus.
- Named/saved scenario comparison (e.g. "Base" vs "Aggressive" side-by-side).
- Per-rep sandbagging correction instead of one global multiplier.
- Secondary "next quarter" forecast total for slipped-out deals.
- Monte Carlo confidence interval as an alternate view.
- Table filtering/search.
