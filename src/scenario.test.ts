import { describe, it, expect } from "vitest";
import { generateScenario, type ScenarioConfig } from "./scenario.js";

const config: ScenarioConfig = {
    seed: 42, width: 20, height: 20, driverCount: 5, orderCount: 12, duration: 30
};

describe("generateScenario", () => {
    it("is reproducible for the same config", () => {
        expect(generateScenario(config)).toEqual(generateScenario(config));
    });

    it("differs for different seeds", () => {
        expect(generateScenario({ ...config, seed: 43 })).not.toEqual(generateScenario(config));
    });

    it("creates the requested counts, all idle drivers and created orders, at time 0", () => {
        const s = generateScenario(config);
        expect(s.time).toBe(0);
        expect(s.drivers).toHaveLength(5);
        expect(s.orders).toHaveLength(12);
        expect(s.drivers.every((d) => d.status === "idle")).toBe(true);
        expect(s.orders.every((o) => o.status === "created")).toBe(true);
    });

    it("uses unique ids", () => {
        const s = generateScenario(config);
        expect(new Set(s.drivers.map((d) => d.id)).size).toBe(5);
        expect(new Set(s.orders.map((o) => o.id)).size).toBe(12);
    });

    it("keeps locations inside the area and creation times inside the duration", () => {
        const s = generateScenario({ ...config, driverCount: 50, orderCount: 200 });
        const inside = (p: { x: number; y: number }) =>
            p.x >= 0 && p.x <= 20 && p.y >= 0 && p.y <= 20;
        expect(s.drivers.every((d) => inside(d.location))).toBe(true);
        expect(s.orders.every((o) => inside(o.pickup) && inside(o.dropoff))).toBe(true);
        expect(s.orders.every((o) => o.createdAt >= 0 && o.createdAt <= 29)).toBe(true);
    });

    it("sorts orders by createdAt", () => {
        const times = generateScenario(config).orders.map((o) => o.createdAt);
        expect(times).toEqual([...times].sort((a, b) => a - b));
    });

    it("changing driverCount leaves the orders unchanged", () => {
        const a = generateScenario(config);
        const b = generateScenario({ ...config, driverCount: 9 });
        expect(b.orders).toEqual(a.orders);
    });

    it("changing orderCount leaves the drivers unchanged", () => {
        const a = generateScenario(config);
        const b = generateScenario({ ...config, orderCount: 30 });
        expect(b.drivers).toEqual(a.drivers);
    });

    it("allows zero drivers or zero orders", () => {
        expect(generateScenario({ ...config, driverCount: 0 }).drivers).toEqual([]);
        expect(generateScenario({ ...config, orderCount: 0 }).orders).toEqual([]);
    });

    it("rejects invalid configs", () => {
        expect(() => generateScenario({ ...config, driverCount: -1 })).toThrow();
        expect(() => generateScenario({ ...config, orderCount: 1.5 })).toThrow();
        expect(() => generateScenario({ ...config, duration: 0 })).toThrow();
    });
});