import { describe, it, expect } from "vitest";
import { compareStrategies, formatComparisonTable, summarize } from "./compare.js";
import { createScoringStrategy, strategyRegistry, type StrategyInfo } from "./strategies.js";

const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const baseConfig = { width: 20, height: 20, driverCount: 4, orderCount: 10, duration: 20 };

describe("summarize", () => {
    it("computes mean, sample standard deviation, min and max", () => {
        const s = summarize([1, 2, 3])!;
        expect(s.n).toBe(3);
        expect(s.mean).toBe(2);
        expect(s.stdDev).toBeCloseTo(1);
        expect(s.min).toBe(1);
        expect(s.max).toBe(3);
    });

    it("returns null for no data and zero spread for one value", () => {
        expect(summarize([])).toBeNull();
        expect(summarize([5])!.stdDev).toBe(0);
    });
});

describe("compareStrategies", () => {
    it("reports every strategy, in order, with one run per seed", () => {
        const reports = compareStrategies({ baseConfig, seeds, strategies: strategyRegistry, maxTicks: 1000 });
        expect(reports.map((r) => r.id)).toEqual(strategyRegistry.map((s) => s.id));
        expect(reports.every((r) => r.runs === seeds.length)).toBe(true);
        expect(reports[0]!.vsBaseline).toBeNull();
        expect(reports[1]!.vsBaseline).not.toBeNull();
    });

    it("is deterministic", () => {
        const options = { baseConfig, seeds, strategies: strategyRegistry, maxTicks: 1000 };
        expect(compareStrategies(options)).toEqual(compareStrategies(options));
    });

    it("scoring with weight 0 is identical to nearest on every seed", () => {
        const zero: StrategyInfo = {
            id: "zero",
            label: "Zero weight",
            description: "",
            strategy: createScoringStrategy({ idleWeight: 0 })
        };
        const nearest = strategyRegistry[0]!;
        const [base, other] = compareStrategies({
            baseConfig, seeds, strategies: [nearest, zero], maxTicks: 1000
        });
        expect(other!.vsBaseline).toEqual({ better: 0, worse: 0, same: seeds.length });
        expect(other!.avgDeliveryTime).toEqual(base!.avgDeliveryTime);
    });

    it("counts unfinished runs and reports unknown averages when nothing can be delivered", () => {
        const [report] = compareStrategies({
            baseConfig: { ...baseConfig, driverCount: 0 },
            seeds,
            strategies: strategyRegistry,
            maxTicks: 20
        });
        expect(report!.incompleteRuns).toBe(seeds.length);
        expect(report!.avgDeliveryTime).toBeNull();
        expect(report!.worstDeliveryTime).toBeNull();
    });

    it("rejects empty seeds or strategies", () => {
        expect(() => compareStrategies({ baseConfig, seeds: [], strategies: strategyRegistry, maxTicks: 10 })).toThrow();
        expect(() => compareStrategies({ baseConfig, seeds, strategies: [], maxTicks: 10 })).toThrow();
    });
});

describe("formatComparisonTable", () => {
    it("includes every strategy label and the baseline marker", () => {
        const reports = compareStrategies({ baseConfig, seeds, strategies: strategyRegistry, maxTicks: 1000 });
        const table = formatComparisonTable(reports);
        for (const info of strategyRegistry) expect(table).toContain(info.label);
        expect(table).toContain("(baseline)");
    });
});