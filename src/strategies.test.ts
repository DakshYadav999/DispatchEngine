import { describe, it, expect } from "vitest";
import { createScoringStrategy, getStrategy, strategyRegistry } from "./strategies.js";
import { nearestDriverStrategy } from "./assignment.js";
import { runSimulation } from "./run.js";
import { generateScenario } from "./scenario.js";
import type { Driver, Order } from "./types.js";

function driver(id: string, x: number, y: number, idleSince?: number): Driver {
    return {
        id,
        location: { x, y },
        status: "idle",
        ...(idleSince !== undefined ? { idleSince } : {})
    };
}

function order(id: string, x: number, y: number): Order {
    return {
        id,
        pickup: { x, y },
        dropoff: { x: x + 1, y },
        status: "created",
        createdAt: 0
    };
}

describe("createScoringStrategy", () => {
    it("with weight 0 behaves exactly like nearest-driver", () => {
        const drivers = [driver("A", 5, 5), driver("B", 1, 0), driver("C", 9, 2)];
        const orders = [order("o1", 0, 0), order("o2", 8, 2)];
        const scoring = createScoringStrategy({ idleWeight: 0 });
        expect(scoring(orders, drivers, 10)).toEqual(nearestDriverStrategy(orders, drivers, 10));
    });

    it("prefers a long-idle driver over a slightly closer one", () => {
        // time 10: A just finished (idle 0), B has never worked (idle 10)
        // A: 1 - 0.5*0 = 1     B: 3 - 0.5*10 = -2
        const drivers = [driver("A", 1, 0, 10), driver("B", 3, 0)];
        const orders = [order("o1", 0, 0)];
        const scoring = createScoringStrategy({ idleWeight: 0.5 });
        expect(scoring(orders, drivers, 10)).toEqual([{ orderId: "o1", driverId: "B" }]);
        expect(nearestDriverStrategy(orders, drivers, 10)).toEqual([{ orderId: "o1", driverId: "A" }]);
    });

    it("breaks ties in favor of the earlier driver", () => {
        const drivers = [driver("A", 1, 0), driver("B", 1, 0)];
        const scoring = createScoringStrategy({ idleWeight: 0.5 });
        expect(scoring([order("o1", 0, 0)], drivers, 4)[0]!.driverId).toBe("A");
    });

    it("never uses a driver twice and stops when drivers run out", () => {
        const drivers = [driver("A", 1, 0), driver("B", 2, 0)];
        const orders = [order("o1", 0, 0), order("o2", 0, 1), order("o3", 0, 2)];
        const result = createScoringStrategy({ idleWeight: 0.5 })(orders, drivers, 3);
        expect(result).toHaveLength(2);
        expect(new Set(result.map((a) => a.driverId)).size).toBe(2);
    });

    it("rejects a negative or non-finite weight", () => {
        expect(() => createScoringStrategy({ idleWeight: -1 })).toThrow();
        expect(() => createScoringStrategy({ idleWeight: NaN })).toThrow();
    });
});

describe("strategy registry", () => {
    it("has unique ids", () => {
        const ids = strategyRegistry.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("looks strategies up by id and rejects unknown ones", () => {
        expect(getStrategy("nearest")).toBe(nearestDriverStrategy);
        expect(() => getStrategy("nope")).toThrow();
    });

    it("every registered strategy completes a full scenario without breaking the engine", () => {
        const config = { seed: 7, width: 20, height: 20, driverCount: 5, orderCount: 12, duration: 30 };
        for (const info of strategyRegistry) {
            const result = runSimulation(generateScenario(config), {
                maxTicks: 1000,
                strategy: info.strategy
            });
            expect(result.completed, info.id).toBe(true);
            expect(result.finalState.orders.every((o) => o.status === "delivered"), info.id).toBe(true);
        }
    });
});