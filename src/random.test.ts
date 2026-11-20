
import { describe, it, expect } from "vitest";
import { createRng, randomInt, randomPoint } from "./random.js";

describe("createRng", () => {
    it("Same seed produces the same first 10 numbers", () => {
        const rng1 = createRng(42);
        const rng2 = createRng(42);

        const sequence1 = Array.from({ length: 10 }, () => rng1());
        const sequence2 = Array.from({ length: 10 }, () => rng2());

        expect(sequence1).toEqual(sequence2);
    });

    it("Different seeds produce different sequences", () => {
        const rng1 = createRng(42);
        const rng2 = createRng(100);

        const sequence1 = Array.from({ length: 10 }, () => rng1());
        const sequence2 = Array.from({ length: 10 }, () => rng2());

        expect(sequence1).not.toEqual(sequence2);
    });

    it("Every generated number is between 0 and 1", () => {
        const rng = createRng(42);

        for (let i = 0; i < 1000; i++) {
            const value = rng();

            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    it("Two generators do not interfere with each other", () => {
        const rngA = createRng(42);
        const rngB = createRng(42);

        const expectedRng = createRng(42);
        const expected = Array.from(
            { length: 10 },
            () => expectedRng()
        );

        const resultsA: number[] = [];
        const resultsB: number[] = [];

        for (let i = 0; i < 10; i++) {
            resultsA.push(rngA());
            resultsB.push(rngB());
        }

        expect(resultsA).toEqual(expected);
        expect(resultsB).toEqual(expected);
    });
});

describe("randomInt", () => {
    it("returns an integer within the inclusive range", () => {
        const rng = createRng(42);

        for (let i = 0; i < 1000; i++) {
            const value = randomInt(rng, 1, 6);

            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(6);
        }
    });

    it("can generate every value in the range", () => {
        const rng = createRng(42);
        const results = new Set<number>();

        for (let i = 0; i < 1000; i++) {
            results.add(randomInt(rng, 1, 6));
        }

        expect(results.size).toBe(6);
    });
});

describe("randomPoint", () => {
    it("generates points within the given boundaries", () => {
        const rng = createRng(42);

        for (let i = 0; i < 1000; i++) {
            const point = randomPoint(rng, 10, 20);

            expect(point.x).toBeGreaterThanOrEqual(0);
            expect(point.x).toBeLessThanOrEqual(10);

            expect(point.y).toBeGreaterThanOrEqual(0);
            expect(point.y).toBeLessThanOrEqual(20);
        }
    });

    it("generates integer coordinates", () => {
        const rng = createRng(42);

        for (let i = 0; i < 100; i++) {
            const point = randomPoint(rng, 10, 20);

            expect(Number.isInteger(point.x)).toBe(true);
            expect(Number.isInteger(point.y)).toBe(true);
        }
    });
});