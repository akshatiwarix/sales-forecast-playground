import { describe, expect, it } from "vitest";
import {
  classifyDeals,
  computeForecast,
  computeSensitivity,
  effectiveProbability,
  isInQuarter,
} from "./forecast";
import { DEFAULT_ASSUMPTIONS, QUARTER_END } from "./types";
import type { Assumptions, Deal } from "./types";

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "deal-test",
    account: "Test Co",
    owner: "Test Rep",
    amount: 10000,
    stage: "Proposal",
    stageEnteredDate: "2026-08-01",
    expectedCloseDate: "2026-09-20",
    repProbability: 0.5,
    ...overrides,
  };
}

describe("effectiveProbability", () => {
  it("uses rep-entered probability under default assumptions", () => {
    const deal = makeDeal({ repProbability: 0.4 });
    expect(effectiveProbability(deal, DEFAULT_ASSUMPTIONS)).toBe(0.4);
  });

  it("applies the sandbagging correction to the rep-entered probability", () => {
    const deal = makeDeal({ repProbability: 0.4 });
    const assumptions: Assumptions = { ...DEFAULT_ASSUMPTIONS, sandbaggingCorrection: 1.5 };
    expect(effectiveProbability(deal, assumptions)).toBeCloseTo(0.6);
  });

  it("clips the corrected probability to [0, 1]", () => {
    const deal = makeDeal({ repProbability: 0.9 });
    const assumptions: Assumptions = { ...DEFAULT_ASSUMPTIONS, sandbaggingCorrection: 2 };
    expect(effectiveProbability(deal, assumptions)).toBe(1);
  });

  it("replaces the rep-entered probability when a per-stage override is set", () => {
    const deal = makeDeal({ stage: "Negotiation", repProbability: 0.9 });
    const assumptions: Assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      stageWinRate: { Negotiation: 0.2 },
      sandbaggingCorrection: 1.5, // must be ignored once the stage is overridden
    };
    expect(effectiveProbability(deal, assumptions)).toBe(0.2);
  });

  it("leaves other stages' probabilities untouched by an unrelated override", () => {
    const deal = makeDeal({ stage: "Proposal", repProbability: 0.4 });
    const assumptions: Assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      stageWinRate: { Negotiation: 0.2 },
    };
    expect(effectiveProbability(deal, assumptions)).toBe(0.4);
  });
});

describe("isInQuarter", () => {
  it("keeps a deal closing well before quarter end", () => {
    const deal = makeDeal({ expectedCloseDate: "2026-09-01" });
    expect(isInQuarter(deal, 0)).toBe(true);
  });

  it("keeps a deal closing exactly on the quarter boundary", () => {
    const deal = makeDeal({ expectedCloseDate: QUARTER_END });
    expect(isInQuarter(deal, 0)).toBe(true);
  });

  it("drops a deal already dated past quarter end", () => {
    const deal = makeDeal({ expectedCloseDate: "2026-10-05" });
    expect(isInQuarter(deal, 0)).toBe(false);
  });

  it("pushes a deal past quarter end once slippage weeks accumulate", () => {
    const deal = makeDeal({ expectedCloseDate: "2026-09-25" });
    expect(isInQuarter(deal, 0)).toBe(true);
    expect(isInQuarter(deal, 1)).toBe(false);
  });
});

describe("computeForecast", () => {
  it("classifies a deal below the commit threshold as best-case only", () => {
    const deals = [makeDeal({ amount: 10000, repProbability: 0.5 })];
    const totals = computeForecast(deals, DEFAULT_ASSUMPTIONS);
    expect(totals.bestCase).toBe(10000);
    expect(totals.commit).toBe(0);
    expect(totals.weighted).toBe(5000);
  });

  it("counts a deal at exactly the commit threshold as committed", () => {
    const deals = [makeDeal({ amount: 10000, repProbability: 0.7 })];
    const totals = computeForecast(deals, DEFAULT_ASSUMPTIONS);
    expect(totals.commit).toBe(10000);
  });

  it("excludes deals that have slipped out of the quarter from every total", () => {
    const deals = [makeDeal({ amount: 10000, expectedCloseDate: "2026-09-25", repProbability: 0.9 })];
    const assumptions: Assumptions = { ...DEFAULT_ASSUMPTIONS, slippageWeeks: 1 };
    const totals = computeForecast(deals, assumptions);
    expect(totals).toEqual({ bestCase: 0, commit: 0, weighted: 0 });
  });

  it("sums weighted value across multiple deals", () => {
    const deals = [
      makeDeal({ id: "a", amount: 10000, repProbability: 0.5 }),
      makeDeal({ id: "b", amount: 20000, repProbability: 0.25 }),
    ];
    const totals = computeForecast(deals, DEFAULT_ASSUMPTIONS);
    expect(totals.weighted).toBe(10000);
  });
});

describe("computeSensitivity", () => {
  it("produces one point per week from 0 to maxWeeks, non-increasing as weeks grow", () => {
    const deals = [
      makeDeal({ id: "a", expectedCloseDate: "2026-09-15", repProbability: 0.6 }),
      makeDeal({ id: "b", expectedCloseDate: "2026-09-29", repProbability: 0.6 }),
    ];
    const points = computeSensitivity(deals, DEFAULT_ASSUMPTIONS, 4);
    expect(points).toHaveLength(5);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].weighted).toBeLessThanOrEqual(points[i - 1].weighted);
    }
    expect(points[0].weighted).toBeGreaterThan(points[4].weighted);
  });
});

describe("classifyDeals", () => {
  it("flags a slipped deal as out of quarter regardless of its probability", () => {
    const deals = [makeDeal({ expectedCloseDate: "2026-09-25", repProbability: 0.9 })];
    const assumptions: Assumptions = { ...DEFAULT_ASSUMPTIONS, slippageWeeks: 1 };
    const [computed] = classifyDeals(deals, assumptions);
    expect(computed.inQuarter).toBe(false);
    expect(computed.category).toBe("commit"); // probability-based category is independent of the quarter flag
  });

  it("returns no-chance for a deal with an explicit zero override", () => {
    const deals = [makeDeal({ stage: "Prospecting", repProbability: 0.5 })];
    const assumptions: Assumptions = { ...DEFAULT_ASSUMPTIONS, stageWinRate: { Prospecting: 0 } };
    const [computed] = classifyDeals(deals, assumptions);
    expect(computed.category).toBe("no-chance");
  });
});
