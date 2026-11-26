import { compareStrategies, formatComparisonTable } from "./compare.js";
import { strategyRegistry } from "./strategies.js";

const seeds = Array.from({ length: 50 }, (_, i) => i + 1);

const scenarios = [
    { name: "Normal load", config: { width: 20, height: 20, driverCount: 6, orderCount: 40, duration: 60 } },
    { name: "Demand spike", config: { width: 20, height: 20, driverCount: 6, orderCount: 40, duration: 10 } }
];

for (const scenario of scenarios) {
    const reports = compareStrategies({
        baseConfig: scenario.config,
        seeds,
        strategies: strategyRegistry,
        maxTicks: 2000
    });
    console.log(`\n${scenario.name} (${seeds.length} seeds)`);
    console.log(formatComparisonTable(reports));
}