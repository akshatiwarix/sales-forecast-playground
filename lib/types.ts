// Fixed reference date the whole pipeline is evaluated against, so the
// deployed demo's forecast never silently changes as real time passes.
export const AS_OF_DATE = "2026-08-31";

// Current quarter (Q3 2026) the headline forecast totals are scoped to.
export const QUARTER_START = "2026-07-01";
export const QUARTER_END = "2026-09-30";

// Slider range for the slippage lever. 12 weeks covers the full quarter,
// so the sensitivity chart shows the entire curve down to whatever survives.
export const MAX_SLIPPAGE_WEEKS = 12;

// Fixed constant, not a slider — see PLAN.md's "Category thresholds" decision.
export const COMMIT_THRESHOLD = 0.7;

export type Stage = "Prospecting" | "Qualification" | "Proposal" | "Negotiation";

export const STAGES: Stage[] = ["Prospecting", "Qualification", "Proposal", "Negotiation"];

export interface Deal {
  id: string;
  account: string;
  owner: string;
  amount: number;
  stage: Stage;
  stageEnteredDate: string; // ISO date
  expectedCloseDate: string; // ISO date
  repProbability: number; // 0-1, rep-entered
}

export interface Assumptions {
  stageWinRate: Partial<Record<Stage, number>>; // per-stage override, 0-1
  slippageWeeks: number;
  sandbaggingCorrection: number; // multiplier on rep-entered probability
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  stageWinRate: {},
  slippageWeeks: 0,
  sandbaggingCorrection: 1,
};
