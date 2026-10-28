import {describe,it,expect} from "vitest";
import { distance } from "./geometry.js";

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