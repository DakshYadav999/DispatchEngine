import {describe,it,expect} from "vitest";
import { distance,moveToward } from "./geometry.js";


describe("distance",()=>{
    it("returns zero  for the same point",()=>{
        expect(distance({x:2,y:5},{x:2,y:5})).toBe(0);
    });

    it("calculates the distance correctly",()=>{
        expect(distance({x:0,y:0},{x:3,y:4})).toBe(5);
    });

    it("returns the same distance regardless of the point order",()=>{
        const a={x:2,y:3};
        const b={x:5,y:7};
        expect(distance(a,b)).toBe((distance(b,a)));
    });
});

describe("moveToward", () => {
    it("Straight along the X-axis", () => {
        expect(
            moveToward({ x:0,y:0 },{x:10,y:0},1)
        ).toEqual({ x: 1, y: 0 });
    });

    it("Diagonal Movement", () => {
        const result = moveToward({ x: 0, y: 0 }, { x: 3, y: 4 }, 1);

        expect(result.x).toBeCloseTo(0.6);
        expect(result.y).toBeCloseTo(0.8);
    });

    it("Negative Direction", () => {
        expect(
            moveToward({ x: 5, y: 5 }, { x: 0, y: 5 }, 2)
        ).toEqual({ x: 3, y: 5 });
    });

    it("Step bigger than the Distance", () => {
        expect(
            moveToward({ x: 0, y: 0 }, { x: 1, y: 0 }, 5)
        ).toEqual({ x: 1, y: 0 });
    });

    it("Step equal to the Distance", () => {
        expect(
            moveToward({ x: 0, y: 0 }, { x: 1, y: 0 }, 1)
        ).toEqual({ x: 1, y: 0 });
    });

    it("Already at the target", () => {
        expect(
            moveToward({ x: 3, y: 4 }, { x: 3, y: 4 }, 1)
        ).toEqual({ x: 3, y: 4 });
    });

    it("Does not produce NaN when already at the target", () => {
        const result = moveToward({ x: 3, y: 4 }, { x: 3, y: 4 }, 1);

        expect(Number.isNaN(result.x)).toBe(false);
        expect(Number.isNaN(result.y)).toBe(false);
    });

    it("Does not mutate input points", () => {
        const from = { x: 0, y: 0 };
        const to = { x: 10, y: 0 };

        const fromSnapshot = { ...from };
        const toSnapshot = { ...to };

        moveToward(from, to, 1);

        expect(from).toEqual(fromSnapshot);
        expect(to).toEqual(toSnapshot);
    });
});