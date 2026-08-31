"use client";

import { useMemo, useState } from "react";
import type { DealComputed } from "@/lib/forecast";
import { formatCurrency, formatDate, formatPercent } from "./format";

type SortKey =
  | "account"
  | "stage"
  | "amount"
  | "expectedCloseDate"
  | "repProbability"
  | "effectiveProbability";

interface Props {
  rows: DealComputed[];
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "stage", label: "Stage" },
  { key: "amount", label: "Amount" },
  { key: "expectedCloseDate", label: "Close date" },
  { key: "repProbability", label: "Rep prob." },
  { key: "effectiveProbability", label: "Effective prob." },
];

function sortValue(row: DealComputed, key: SortKey): string | number {
  switch (key) {
    case "account":
      return row.deal.account;
    case "stage":
      return row.deal.stage;
    case "amount":
      return row.deal.amount;
    case "expectedCloseDate":
      return row.deal.expectedCloseDate;
    case "repProbability":
      return row.deal.repProbability;
    case "effectiveProbability":
      return row.effectiveProbability;
  }
}

const CATEGORY_LABEL: Record<DealComputed["category"], string> = {
  commit: "Commit",
  "best-case": "Best Case",
  "no-chance": "No chance",
};

const CATEGORY_CLASS: Record<DealComputed["category"], string> = {
  commit: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "best-case": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "no-chance": "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

export function DealTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return direction === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, direction]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 bg-white dark:bg-neutral-950">
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    {col.label}
                    {sortKey === col.key && <span>{direction === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Category</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.deal.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
              >
                <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                  {row.deal.account}
                </td>
                <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                  {row.deal.stage}
                </td>
                <td className="px-3 py-2 tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(row.deal.amount)}
                </td>
                <td className="px-3 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                  {formatDate(row.deal.expectedCloseDate)}
                </td>
                <td className="px-3 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                  {formatPercent(row.deal.repProbability)}
                </td>
                <td className="px-3 py-2 tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatPercent(row.effectiveProbability)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${CATEGORY_CLASS[row.category]}`}
                  >
                    {row.inQuarter ? CATEGORY_LABEL[row.category] : "Moved to next quarter"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
