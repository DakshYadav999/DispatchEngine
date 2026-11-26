import { computeMetrics, type Metrics } from "./metrics.js";
import { runSimulation } from "./run.js";
import { generateScenario, type ScenarioConfig } from "./scenario.js";
import type { StrategyInfo } from "./strategies.js";

export type Summary = {
    n: number;
    mean: number;
    stdDev: number; // sample standard deviation
    min: number;
    max: number;
};

export function summarize(values: number[]): Summary | null {
    if (values.length === 0) return null;
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance =
        n === 1 ? 0 : values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
    return {
        n,
        mean,
        stdDev: Math.sqrt(variance),
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

export type VsBaseline = { better: number; worse: number; same: number };

export type StrategyReport = {
    id: string;
    label: string;
    runs: number;
    incompleteRuns: number;
    avgAssignmentDelay: Summary | null;
    avgTimeToPickup: Summary | null;
    avgDeliveryTime: Summary | null;
    driverUtilization: Summary | null;
    worstDeliveryTime: number | null;
    vsBaseline: VsBaseline | null; // null for the baseline itself (the first strategy)
};

export type ComparisonOptions = {
    baseConfig: Omit<ScenarioConfig, "seed">;
    seeds: number[];
    strategies: readonly StrategyInfo[]; // the first one is the baseline
    maxTicks: number;
    driverSpeed?: number;
};

// Pull one metric out of every run, dropping runs where it is unknown (null).
function collect(list: Metrics[], pick: (m: Metrics) => number | null): number[] {
    const values: number[] = [];
    for (const m of list) {
        const v = pick(m);
        if (v !== null) values.push(v);
    }
    return values;
}

export function compareStrategies(options: ComparisonOptions): StrategyReport[] {
    const { baseConfig, seeds, strategies, maxTicks, driverSpeed = 1 } = options;

    if (seeds.length === 0) throw new RangeError("seeds must not be empty");
    if (strategies.length === 0) throw new RangeError("strategies must not be empty");

    // results[i][s] = metrics of strategy i on seed s
    const results: Metrics[][] = strategies.map(() => []);

    for (const seed of seeds) {
        // One scenario per seed, shared by every strategy. runSimulation never
        // mutates its input, so sharing is safe.
        const initial = generateScenario({ ...baseConfig, seed });
        strategies.forEach((info, i) => {
            const run = runSimulation(initial, {
                maxTicks,
                driverSpeed,
                strategy: info.strategy
            });
            results[i]!.push(computeMetrics(run));
        });
    }

    const baseline = results[0]!;

    return strategies.map((info, i) => {
        const list = results[i]!;

        let vsBaseline: VsBaseline | null = null;
        if (i > 0) {
            const tally: VsBaseline = { better: 0, worse: 0, same: 0 };
            list.forEach((m, s) => {
                const a = m.avgDeliveryTime;
                const b = baseline[s]!.avgDeliveryTime;
                if (a === null || b === null) return;
                if (a < b - 1e-9) tally.better++;
                else if (a > b + 1e-9) tally.worse++;
                else tally.same++;
            });
            vsBaseline = tally;
        }

        const worst = collect(list, (m) => m.maxDeliveryTime);

        return {
            id: info.id,
            label: info.label,
            runs: list.length,
            incompleteRuns: list.filter((m) => !m.completed).length,
            avgAssignmentDelay: summarize(collect(list, (m) => m.avgAssignmentDelay)),
            avgTimeToPickup: summarize(collect(list, (m) => m.avgTimeToPickup)),
            avgDeliveryTime: summarize(collect(list, (m) => m.avgDeliveryTime)),
            driverUtilization: summarize(collect(list, (m) => m.driverUtilization)),
            worstDeliveryTime: worst.length === 0 ? null : Math.max(...worst),
            vsBaseline
        };
    });
}

export function formatComparisonTable(reports: StrategyReport[]): string {
    const fmt = (s: Summary | null): string =>
        s === null ? "n/a" : `${s.mean.toFixed(2)} ±${s.stdDev.toFixed(2)}`;

    const header = [
        "Strategy",
        "Avg delivery",
        "Avg pickup",
        "Avg assign delay",
        "Utilization",
        "Worst",
        "Unfinished",
        "vs baseline (better/worse/same)"
    ];

    const rows = reports.map((r) => [
        r.label,
        fmt(r.avgDeliveryTime),
        fmt(r.avgTimeToPickup),
        fmt(r.avgAssignmentDelay),
        fmt(r.driverUtilization),
        r.worstDeliveryTime === null ? "n/a" : String(r.worstDeliveryTime),
        `${r.incompleteRuns}/${r.runs}`,
        r.vsBaseline === null
            ? "(baseline)"
            : `${r.vsBaseline.better}/${r.vsBaseline.worse}/${r.vsBaseline.same}`
    ]);

    const widths = header.map((h, c) =>
        Math.max(h.length, ...rows.map((row) => row[c]!.length))
    );
    const line = (cells: string[]): string =>
        cells.map((cell, c) => cell.padEnd(widths[c]!)).join("  ");

    return [
        line(header),
        line(widths.map((w) => "-".repeat(w))),
        ...rows.map(line)
    ].join("\n");
}