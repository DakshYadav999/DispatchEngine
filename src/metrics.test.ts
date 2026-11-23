import { describe, it, expect } from "vitest";
import { computeMetrics } from "./metrics.js";
import { runSimulation } from "./run.js";
import { addDriver, addOrder, createEmptyState } from "./builders.js";
import { generateScenario } from "./scenario.js";

describe("computeMetrics", () => {
    it("measures a single journey exactly", () => {
        let s = createEmptyState();
        s = addDriver(s, { id: "d1", location: { x: 0, y: 0 } });
        s = addOrder(s, { id: "o1", pickup: { x: 3, y: 0 }, dropoff: { x: 3, y: 4 } });
        const m = computeMetrics(runSimulation(s, { maxTicks: 100 }));

        expect(m.delivered).toBe(1);
        expect(m.unassigned).toBe(0);
        expect(m.avgAssignmentDelay).toBe(0);
        expect(m.avgTimeToPickup).toBe(3);
        expect(m.avgDeliveryTime).toBe(7);
        expect(m.maxDeliveryTime).toBe(7);
        expect(m.ticks).toBe(7);
        expect(m.completed).toBe(true);
        expect(m.driverUtilization).toBeCloseTo(6 / 7);
    });

    it("measures two orders sharing one driver", () => {
        let s = createEmptyState();
        s = addDriver(s, { id: "d1", location: { x: 0, y: 0 } });
        s = addOrder(s, { id: "o1", pickup: { x: 3, y: 0 }, dropoff: { x: 3, y: 4 } });
        s = addOrder(s, { id: "o2", pickup: { x: 3, y: 4 }, dropoff: { x: 3, y: 6 } });
        const m = computeMetrics(runSimulation(s, { maxTicks: 100 }));

        // o1: assigned 0, picked up 3, delivered 7
        // o2: assigned 7, picked up 8, delivered 10 (created at 0)
        expect(m.avgAssignmentDelay).toBeCloseTo(3.5);
        expect(m.avgTimeToPickup).toBeCloseTo(5.5);
        expect(m.avgDeliveryTime).toBeCloseTo(8.5);
        expect(m.maxDeliveryTime).toBe(10);
        expect(m.ticks).toBe(10);
        expect(m.driverUtilization).toBeCloseTo(0.8); // busy in 8 of 10 states
    });

    it("counts orders nobody could take as unassigned, with unknown averages", () => {
        let s = createEmptyState();
        s = addOrder(s, { id: "o1", pickup: { x: 1, y: 1 }, dropoff: { x: 2, y: 2 } });
        const m = computeMetrics(runSimulation(s, { maxTicks: 5 }));

        expect(m.unassigned).toBe(1);
        expect(m.delivered).toBe(0);
        expect(m.avgDeliveryTime).toBeNull();
        expect(m.maxDeliveryTime).toBeNull();
        expect(m.driverUtilization).toBeNull(); // no drivers at all
        expect(m.completed).toBe(false);
    });

    it("separates orders that have not arrived yet from unassigned ones", () => {
        let s = createEmptyState();
        s = addDriver(s, { id: "d1", location: { x: 0, y: 0 } });
        s = addOrder(s, { id: "late", pickup: { x: 1, y: 1 }, dropoff: { x: 2, y: 2 }, createdAt: 10 });
        const m = computeMetrics(runSimulation(s, { maxTicks: 5 }));

        expect(m.notYetArrived).toBe(1);
        expect(m.unassigned).toBe(0);
        expect(m.driverUtilization).toBe(0);
    });

    it("returns nulls for an empty run", () => {
        const m = computeMetrics(runSimulation(createEmptyState(), { maxTicks: 10 }));
        expect(m.totalOrders).toBe(0);
        expect(m.avgAssignmentDelay).toBeNull();
        expect(m.driverUtilization).toBeNull();
        expect(m.completed).toBe(true);
    });

    it("excludes offline drivers from utilization", () => {
        let s = createEmptyState();
        s = addOrder(s, { id: "o1", pickup: { x: 1, y: 1 }, dropoff: { x: 2, y: 2 } });
        s = { ...s, drivers: [{ id: "d1", location: { x: 0, y: 0 }, status: "offline" }] };
        const m = computeMetrics(runSimulation(s, { maxTicks: 3 }));
        expect(m.driverUtilization).toBeNull();
    });

    it("is consistent on a random scenario", () => {
        const config = { seed: 7, width: 20, height: 20, driverCount: 5, orderCount: 12, duration: 30 };
        const m = computeMetrics(runSimulation(generateScenario(config), { maxTicks: 1000 }));

        expect(m.delivered).toBe(12);
        expect(m.delivered + m.cancelled + m.inProgress + m.unassigned + m.notYetArrived)
            .toBe(m.totalOrders);
        expect(m.avgDeliveryTime!).toBeGreaterThanOrEqual(m.avgTimeToPickup!);
        expect(m.avgTimeToPickup!).toBeGreaterThanOrEqual(m.avgAssignmentDelay!);
        expect(m.driverUtilization!).toBeGreaterThan(0);
        expect(m.driverUtilization!).toBeLessThanOrEqual(1);
    });
});