import { describe, it, expect } from "vitest";
import { findNearestDriver } from "./assignment.js";
import type {Driver,Order} from "./types.js";

function makeDriver(
    id:string,
    x:number,
    y:number,
    status:Driver["status"]
):Driver{
    return {
        id,
        location:{x,y},
        status
    };
}

const order: Order = {
    id: "order-1",
    pickup: { x: 3, y: 4 },
    dropoff: { x: 5, y: 6 },
    status: "created",
    createdAt: 1
};


describe("findNearestDriver",()=>{
    it("returns the only idle driver",()=>{
        const driver=makeDriver("driver-1",3,3,"idle");
        const result=findNearestDriver([driver],order);
        expect(result).toBe(driver)

    });
    it("returns the closest one",()=>{
        const farther=makeDriver("driver-1",7,9,"idle");
        const closer=makeDriver("driver-2",3,3,"idle");
        const result=findNearestDriver([farther,closer],order);
        expect(result).toBe(closer);
    });
    it("ignores busy and offline drivers",()=>{
        const busy = makeDriver("driver-1", 3, 4, "busy");
        const offline = makeDriver("driver-2", 3, 4, "offline");
        const idle = makeDriver("driver-3", 7, 9, "idle");
        const result=findNearestDriver([busy,offline,idle],order);
        expect(result).toBe(idle);
    });
    it("returns undefined when the driver list is empty",()=>{
        const result=findNearestDriver([],order);
        expect(result).toBeUndefined();
    });
    it("returns undefined when no driver is idle",()=>{
        const busy = makeDriver("driver-1", 3, 4, "busy");
        const offline = makeDriver("driver-2", 3, 4, "offline");
        const result=findNearestDriver([busy,offline],order);
        expect(result).toBeUndefined();
    });
    it("keeps the first driver when distances are tied",()=>{
        const driver1=makeDriver("driver-1",3,3,"idle");
        const driver2=makeDriver("driver-2",3,3,"idle");
        const result=findNearestDriver([driver1,driver2],order);
        expect(result).toBe(driver1);
    });
    it("does not modify the drivers or the order", () => {
        const driver = makeDriver("driver-1", 3, 3, "idle");
        findNearestDriver([driver], order);

        expect(driver.status).toBe("idle");
        expect(order.status).toBe("created");
    });
     


});
