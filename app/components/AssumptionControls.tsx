"use client";

import { STAGES } from "@/lib/types";
import type { Assumptions, Stage } from "@/lib/types";
import { formatPercent } from "./format";

const STAGE_DEFAULT_OVERRIDE = 0.5;

interface Props {
  assumptions: Assumptions;
  onChange: (next: Assumptions) => void;
  maxSlippageWeeks: number;
}

export function AssumptionControls({ assumptions, onChange, maxSlippageWeeks }: Props) {
  function setStageOverride(stage: Stage, enabled: boolean, value?: number) {
    const stageWinRate = { ...assumptions.stageWinRate };
    if (enabled) {
      stageWinRate[stage] = value ?? stageWinRate[stage] ?? STAGE_DEFAULT_OVERRIDE;
    } else {
      delete stageWinRate[stage];
    }
    onChange({ ...assumptions, stageWinRate });
  }

  return (
    <section className="flex h-fit flex-col gap-5 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Assumptions</h2>

      <div className="flex flex-col gap-4">
        {STAGES.map((stage) => {
          const override = assumptions.stageWinRate[stage];
          const enabled = override !== undefined;
          return (
            <div key={stage} className="flex flex-col gap-1.5">
              <label className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setStageOverride(stage, e.target.checked)}
                  />
                  {stage}
                </span>
                <span className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
                  {enabled ? formatPercent(override ?? STAGE_DEFAULT_OVERRIDE) : "rep's number"}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                disabled={!enabled}
                value={override ?? STAGE_DEFAULT_OVERRIDE}
                onChange={(e) => setStageOverride(stage, true, Number(e.target.value))}
                className="w-full disabled:opacity-40"
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <label className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
          <span>Slippage</span>
          <span className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
            {assumptions.slippageWeeks} {assumptions.slippageWeeks === 1 ? "week" : "weeks"}
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={maxSlippageWeeks}
          step={1}
          value={assumptions.slippageWeeks}
          onChange={(e) => onChange({ ...assumptions, slippageWeeks: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
          <span>Sandbagging correction</span>
          <span className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
            {assumptions.sandbaggingCorrection.toFixed(2)}x
          </span>
        </label>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={assumptions.sandbaggingCorrection}
          onChange={(e) => onChange({ ...assumptions, sandbaggingCorrection: Number(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Multiplies every rep-entered probability not overridden by a stage
          win rate above. Below 1x assumes reps oversell; above 1x assumes
          they sandbag.
        </p>
      </div>
    </section>
  );
}
