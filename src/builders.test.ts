import { describe, it, expect } from "vitest";
import { addDriver, addOrder, createEmptyState } from "./builders.js";
import { generateScenario } from "./scenario.js";
import { tick } from "./simulation.js";

describe("addDriver", () => {
    it("adds an idle driver without changing the original state", () => {
        const state = createEmptyState();
        const snapshot = structuredClone(state);
        const next = addDriver(state, { id: "d1", location: { x: 1, y: 2 } });
        expect(next.drivers).toEqual([{ id: "d1", location: { x: 1, y: 2 }, status: "idle" }]);
        expect(state).toEqual(snapshot);
    });

    it("rejects a duplicate id", () => {
        const state = addDriver(createEmptyState(), { id: "d1", location: { x: 0, y: 0 } });
        expect(() => addDriver(state, { id: "d1", location: { x: 1, y: 1 } })).toThrow();
    });

    it("rejects non-finite coordinates", () => {
        expect(() => addDriver(createEmptyState(), { id: "d1", location: { x: NaN, y: 0 } })).toThrow();
    });

    it("copies the location it is given", () => {
        const location = { x: 1, y: 1 };
        const state = addDriver(createEmptyState(), { id: "d1", location });
        location.x = 99;
        expect(state.drivers[0]!.location.x).toBe(1);
    });
});

describe("addOrder", () => {
    it("defaults createdAt to the current time and starts as created", () => {
        const state = { ...createEmptyState(), time: 4 };
        const next = addOrder(state, { id: "o1", pickup: { x: 0, y: 0 }, dropoff: { x: 1, y: 1 } });
        expect(next.orders[0]!.createdAt).toBe(4);
        expect(next.orders[0]!.status).toBe("created");
    });

    it("keeps orders sorted by createdAt", () => {
        let s = createEmptyState();
        s = addOrder(s, { id: "late", pickup: { x: 0, y: 0 }, dropoff: { x: 1, y: 1 }, createdAt: 9 });
        s = addOrder(s, { id: "early", pickup: { x: 0, y: 0 }, dropoff: { x: 1, y: 1 }, createdAt: 2 });
        expect(s.orders.map((o) => o.id)).toEqual(["early", "late"]);
    });

    it("rejects duplicate ids and negative createdAt", () => {
        const s = addOrder(createEmptyState(), { id: "o1", pickup: { x: 0, y: 0 }, dropoff: { x: 1, y: 1 } });
        expect(() => addOrder(s, { id: "o1", pickup: { x: 0, y: 0 }, dropoff: { x: 1, y: 1 } })).toThrow();
        expect(() => addOrder(s, { id: "o2", pickup: { x: 0, y: 0 }, dropoff: { x: 1, y: 1 }, createdAt: -1 })).toThrow();
    });
});

describe("manual and random mix", () => {
    it("a fully manual world runs to a delivery", () => {
        let s = createEmptyState();
        s = addDriver(s, { id: "d1", location: { x: 0, y: 0 } });
        s = addOrder(s, { id: "o1", pickup: { x: 3, y: 0 }, dropoff: { x: 3, y: 4 } });
        for (let i = 0; i < 7; i++) s = tick(s, 1);
        expect(s.orders[0]!.status).toBe("delivered");
    });

    it("random drivers with a manual order works", () => {
        let s = generateScenario({ seed: 7, width: 10, height: 10, driverCount: 3, orderCount: 0, duration: 1 });
        s = addOrder(s, { id: "mine", pickup: { x: 5, y: 5 }, dropoff: { x: 6, y: 6 } });
        s = tick(s, 1);
        expect(s.orders[0]!.status).not.toBe("created");
    });
});