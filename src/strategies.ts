import { distance } from "./geometry.js";
import {
    nearestDriverStrategy,
    type Assignment,
    type AssignmentStrategy
} from "./assignment.js";
import type { Driver } from "./types.js";

export type ScoringOptions = { idleWeight: number };

// Lower score wins: distance to pickup, minus a bonus for drivers who have waited longer.
export function createScoringStrategy(options: ScoringOptions): AssignmentStrategy {
    const { idleWeight } = options;
    if (!Number.isFinite(idleWeight) || idleWeight < 0) {
        throw new RangeError(`idleWeight must be a number >= 0, got ${idleWeight}`);
    }

    return (waitingOrders, idleDrivers, time) => {
        let available = idleDrivers;
        const assignments: Assignment[] = [];

        for (const order of waitingOrders) {
            let best: Driver | undefined;
            let bestScore = Infinity;

            for (const driver of available) {
                const idleTime = Math.max(0, time - (driver.idleSince ?? 0));
                const score = distance(driver.location, order.pickup) - idleWeight * idleTime;
                if (score < bestScore) {   // strict <, so ties go to the earlier driver
                    best = driver;
                    bestScore = score;
                }
            }

            if (best === undefined) continue;
            const chosen = best;
            assignments.push({ orderId: order.id, driverId: chosen.id });
            available = available.filter((d) => d.id !== chosen.id);
        }

        return assignments;
    };
}

export const DEFAULT_IDLE_WEIGHT = 0.5;

export type StrategyInfo = {
    id: string;
    label: string;
    description: string;
    strategy: AssignmentStrategy;
};

export const strategyRegistry: readonly StrategyInfo[] = [
    {
        id: "nearest",
        label: "Nearest driver",
        description: "Each order takes the closest free driver.",
        strategy: nearestDriverStrategy
    },
    {
        id: "scoring",
        label: "Distance + idle time",
        description: "Balances pickup distance against how long a driver has been waiting.",
        strategy: createScoringStrategy({ idleWeight: DEFAULT_IDLE_WEIGHT })
    }
];

export function getStrategy(id: string): AssignmentStrategy {
    const info = strategyRegistry.find((s) => s.id === id);
    if (info === undefined) {
        throw new Error(`Unknown strategy: ${id}`);
    }
    return info.strategy;
}