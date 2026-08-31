import type { SensitivityPoint } from "@/lib/forecast";
import { formatCurrencyCompact } from "./format";

interface Props {
  points: SensitivityPoint[];
  currentWeeks: number;
}

const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 24;

export function SensitivityChart({ points, currentWeeks }: Props) {
  const maxWeighted = Math.max(...points.map((p) => p.weighted), 1);
  const maxWeeks = points.length - 1;

  const toX = (weeks: number) => PADDING + (weeks / maxWeeks) * (WIDTH - PADDING * 2);
  const toY = (weighted: number) =>
    HEIGHT - PADDING - (weighted / maxWeighted) * (HEIGHT - PADDING * 2);

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${toX(p.slippageWeeks).toFixed(1)} ${toY(p.weighted).toFixed(1)}`,
    )
    .join(" ");

  const current = points[currentWeeks] ?? points[points.length - 1];

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Weighted forecast vs. slippage
      </h2>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full text-neutral-300 dark:text-neutral-700"
        role="img"
        aria-label="Weighted forecast declining as slippage weeks increase"
      >
        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          stroke="currentColor"
          strokeWidth={1}
        />
        <line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={HEIGHT - PADDING}
          stroke="currentColor"
          strokeWidth={1}
        />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} />
        <line
          x1={toX(current.slippageWeeks)}
          y1={PADDING}
          x2={toX(current.slippageWeeks)}
          y2={HEIGHT - PADDING}
          stroke="#2563eb"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <circle cx={toX(current.slippageWeeks)} cy={toY(current.weighted)} r={4} fill="#2563eb" />
      </svg>
      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>0 weeks · {formatCurrencyCompact(points[0].weighted)}</span>
        <span>
          {maxWeeks} weeks · {formatCurrencyCompact(points[maxWeeks].weighted)}
        </span>
      </div>
    </section>
  );
}
