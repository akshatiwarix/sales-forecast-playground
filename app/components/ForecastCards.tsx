import type { ForecastTotals } from "@/lib/forecast";
import { formatCurrency } from "./format";

const CARDS: { key: keyof ForecastTotals; label: string; hint: string }[] = [
  { key: "bestCase", label: "Best Case", hint: "every open deal with any win probability" },
  { key: "commit", label: "Commit", hint: "deals at or above 70% win probability" },
  { key: "weighted", label: "Weighted", hint: "amount × win probability, summed" },
];

export function ForecastCards({ totals }: { totals: ForecastTotals }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
        >
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {card.label}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatCurrency(totals[card.key])}
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{card.hint}</div>
        </div>
      ))}
    </section>
  );
}
