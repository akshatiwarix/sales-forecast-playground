"use client";

import { useEffect, useMemo, useState } from "react";
import { deals } from "@/data/deals";
import { classifyDeals, computeForecast, computeSensitivity } from "@/lib/forecast";
import { DEFAULT_ASSUMPTIONS, MAX_SLIPPAGE_WEEKS, STAGES } from "@/lib/types";
import type { Assumptions, Stage } from "@/lib/types";
import { AssumptionControls } from "./components/AssumptionControls";
import { DealTable } from "./components/DealTable";
import { ForecastCards } from "./components/ForecastCards";
import { SensitivityChart } from "./components/SensitivityChart";

function stageParamKey(stage: Stage): string {
  return stage.toLowerCase();
}

function parseAssumptions(params: URLSearchParams): Assumptions {
  const stageWinRate: Assumptions["stageWinRate"] = {};
  for (const stage of STAGES) {
    const raw = params.get(stageParamKey(stage));
    if (raw === null) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) stageWinRate[stage] = Math.min(1, Math.max(0, value));
  }

  const slippageParam = params.get("slippage");
  const slippageWeeks =
    slippageParam !== null && Number.isFinite(Number(slippageParam))
      ? Math.min(MAX_SLIPPAGE_WEEKS, Math.max(0, Number(slippageParam)))
      : DEFAULT_ASSUMPTIONS.slippageWeeks;

  const sandbagParam = params.get("sandbag");
  const sandbaggingCorrection =
    sandbagParam !== null && Number.isFinite(Number(sandbagParam))
      ? Number(sandbagParam)
      : DEFAULT_ASSUMPTIONS.sandbaggingCorrection;

  return { stageWinRate, slippageWeeks, sandbaggingCorrection };
}

function assumptionsToParams(assumptions: Assumptions): URLSearchParams {
  const params = new URLSearchParams();
  for (const stage of STAGES) {
    const value = assumptions.stageWinRate[stage];
    if (value !== undefined) params.set(stageParamKey(stage), value.toFixed(2));
  }
  if (assumptions.slippageWeeks !== DEFAULT_ASSUMPTIONS.slippageWeeks) {
    params.set("slippage", String(assumptions.slippageWeeks));
  }
  if (assumptions.sandbaggingCorrection !== DEFAULT_ASSUMPTIONS.sandbaggingCorrection) {
    params.set("sandbag", assumptions.sandbaggingCorrection.toFixed(2));
  }
  return params;
}

export default function Home() {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [hydrated, setHydrated] = useState(false);

  // Read the scenario out of the URL on mount so a shared link reproduces it.
  // window.location has no SSR equivalent, so this can't be computed during
  // render — it has to run once, after mount, in an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssumptions(parseAssumptions(new URLSearchParams(window.location.search)));
    setHydrated(true);
  }, []);

  // Keep the URL in sync with every slider change (after the initial read).
  useEffect(() => {
    if (!hydrated) return;
    const query = assumptionsToParams(assumptions).toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [assumptions, hydrated]);

  const totals = useMemo(() => computeForecast(deals, assumptions), [assumptions]);
  const rows = useMemo(() => classifyDeals(deals, assumptions), [assumptions]);
  const sensitivity = useMemo(
    () => computeSensitivity(deals, assumptions, MAX_SLIPPAGE_WEEKS),
    [assumptions],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Sales Forecast Playground
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {deals.length} open deals this quarter. Drag an assumption and watch
          the forecast recompute — the URL updates so you can share the exact
          scenario.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <AssumptionControls
          assumptions={assumptions}
          onChange={setAssumptions}
          maxSlippageWeeks={MAX_SLIPPAGE_WEEKS}
        />

        <div className="flex flex-col gap-6">
          <ForecastCards totals={totals} />
          <SensitivityChart points={sensitivity} currentWeeks={assumptions.slippageWeeks} />
          <DealTable rows={rows} />
        </div>
      </div>
    </main>
  );
}
