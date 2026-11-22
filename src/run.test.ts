import { describe, it, expect } from "vitest";
import { runSimulation, isFinished } from "./run.js";
import { addDriver, addOrder, createEmptyState } from "./builders.js";
import { generateScenario } from "./scenario.js";

function journeyState() {
    let s = createEmptyState();
    s = addDriver(s, { id: "d1", location: { x: 0, y: 0 } });
    s = addOrder(s, { id: "o1", pickup: { x: 3, y: 0 }, dropoff: { x: 3, y: 4 } });
    return s;
}

describe("isFinished", () => {
    it("is true with no orders", () => {
        expect(isFinished(createEmptyState())).toBe(true);
    });

    it("is false while any order is unfinished", () => {
        expect(isFinished(journeyState())).toBe(false);
    });
});

describe("runSimulation", () => {
    it("with no orders, stops immediately and completes", () => {
        const result = runSimulation(createEmptyState(), { maxTicks: 50 });
        expect(result.history).toHaveLength(1);
        expect(result.completed).toBe(true);
    });

    it("finishes a single journey in exactly 7 ticks", () => {
        const result = runSimulation(journeyState(), { maxTicks: 100 });
        expect(result.completed).toBe(true);
        expect(result.history).toHaveLength(8); // initial state + 7 ticks
        expect(result.finalState.time).toBe(7);
        expect(result.finalState.orders[0]!.status).toBe("delivered");
        expect(result.finalState).toEqual(result.history[7]);
    });

    it("stops at maxTicks and reports not completed", () => {
        const result = runSimulation(journeyState(), { maxTicks: 3 });
        expect(result.history).toHaveLength(4);
        expect(result.completed).toBe(false);
    });

    it("with no drivers, runs to maxTicks and never completes", () => {
        let s = createEmptyState();
        s = addOrder(s, { id: "o1", pickup: { x: 1, y: 1 }, dropoff: { x: 2, y: 2 } });
        const result = runSimulation(s, { maxTicks: 10 });
        expect(result.history).toHaveLength(11);
        expect(result.completed).toBe(false);
    });

    it("keeps history[0] equal to the initial state and does not mutate it", () => {
        const initial = journeyState();
        const snapshot = structuredClone(initial);
        const result = runSimulation(initial, { maxTicks: 100 });
        expect(result.history[0]).toEqual(snapshot);
        expect(initial).toEqual(snapshot);
    });

    it("is deterministic for the same scenario", () => {
        const config = { seed: 42, width: 20, height: 20, driverCount: 5, orderCount: 12, duration: 30 };
        const a = runSimulation(generateScenario(config), { maxTicks: 1000 });
        const b = runSimulation(generateScenario(config), { maxTicks: 1000 });
        expect(a).toEqual(b);
    });

    it("completes a random scenario and keeps invariants at every step", () => {
        const config = { seed: 7, width: 20, height: 20, driverCount: 5, orderCount: 12, duration: 30 };
        const result = runSimulation(generateScenario(config), { maxTicks: 1000 });

        expect(result.completed).toBe(true);
        expect(result.finalState.orders.every((o) => o.status === "delivered")).toBe(true);

        result.history.forEach((s, i) => {
            expect(s.time).toBe(i);
            const busy = s.drivers.filter((d) => d.status === "busy").length;
            const active = s.orders.filter(
                (o) => o.status === "assigned" || o.status === "picked_up"
            ).length;
            expect(busy).toBe(active); // every busy driver has exactly one active order
        });
    });

    it("rejects invalid options", () => {
        const s = createEmptyState();
        expect(() => runSimulation(s, { maxTicks: -1 })).toThrow();
        expect(() => runSimulation(s, { maxTicks: 1.5 })).toThrow();
        expect(() => runSimulation(s, { maxTicks: 10, driverSpeed: 0 })).toThrow();
        expect(() => runSimulation(s, { maxTicks: 10, driverSpeed: NaN })).toThrow();
    });
});