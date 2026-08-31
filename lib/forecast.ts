import { COMMIT_THRESHOLD, QUARTER_END } from "./types";
import type { Assumptions, Deal } from "./types";

export function effectiveProbability(deal: Deal, assumptions: Assumptions): number {
  const override = assumptions.stageWinRate[deal.stage];
  const base =
    override !== undefined ? override : deal.repProbability * assumptions.sandbaggingCorrection;
  return Math.min(1, Math.max(0, base));
}

export function slippedCloseDate(deal: Deal, slippageWeeks: number): Date {
  const date = new Date(`${deal.expectedCloseDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + slippageWeeks * 7);
  return date;
}

export function isInQuarter(deal: Deal, slippageWeeks: number): boolean {
  const closeDate = slippedCloseDate(deal, slippageWeeks);
  const quarterEnd = new Date(`${QUARTER_END}T00:00:00Z`);
  return closeDate.getTime() <= quarterEnd.getTime();
}

export interface ForecastTotals {
  bestCase: number;
  commit: number;
  weighted: number;
}

export function computeForecast(deals: Deal[], assumptions: Assumptions): ForecastTotals {
  let bestCase = 0;
  let commit = 0;
  let weighted = 0;

  for (const deal of deals) {
    if (!isInQuarter(deal, assumptions.slippageWeeks)) continue;

    const probability = effectiveProbability(deal, assumptions);
    weighted += deal.amount * probability;
    if (probability > 0) bestCase += deal.amount;
    if (probability >= COMMIT_THRESHOLD) commit += deal.amount;
  }

  return { bestCase, commit, weighted };
}

export interface SensitivityPoint {
  slippageWeeks: number;
  weighted: number;
}

export function computeSensitivity(
  deals: Deal[],
  assumptions: Assumptions,
  maxWeeks: number,
): SensitivityPoint[] {
  const points: SensitivityPoint[] = [];
  for (let weeks = 0; weeks <= maxWeeks; weeks++) {
    const { weighted } = computeForecast(deals, { ...assumptions, slippageWeeks: weeks });
    points.push({ slippageWeeks: weeks, weighted });
  }
  return points;
}

export type DealCategory = "commit" | "best-case" | "no-chance";

export interface DealComputed {
  deal: Deal;
  effectiveProbability: number;
  inQuarter: boolean;
  category: DealCategory;
}

export function classifyDeals(deals: Deal[], assumptions: Assumptions): DealComputed[] {
  return deals.map((deal) => {
    const probability = effectiveProbability(deal, assumptions);
    const category: DealCategory =
      probability >= COMMIT_THRESHOLD ? "commit" : probability > 0 ? "best-case" : "no-chance";

    return {
      deal,
      effectiveProbability: probability,
      inQuarter: isInQuarter(deal, assumptions.slippageWeeks),
      category,
    };
  });
}
