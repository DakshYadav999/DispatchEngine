import { describe, it, expect } from "vitest";  
import type { SimulationState } from "./types.js";
import { tick } from "./simulation.js";
import type { Driver,Order } from "./types.js";
import type { Point } from "./geometry.js";


function makeDriver(
    id:string,
    x:number,
    y:number,
    status:Driver["status"]
):Driver{
    return{
        id,
        location:{x,y},
        status
    };
}

function makeOrder(
    id:string,
    pickup:Point,
    dropoff:Point,
    status:Order["status"],
    createdAt:number,
    driverId?:string

):Order{
    return{
        id,
        pickup,
        dropoff,
        status,
        createdAt,
         ...(driverId !== undefined ? { driverId } : {}) ///try to remember this IMPORTANT shIT ItS a conditional spread
    };
}

function makeState(
    time:number,
    drivers:Driver[],
    orders:Order[]
):SimulationState{
    return{
        time,
        drivers,
        orders
    };
}

describe("tick",()=>{
    it("No orders yet",()=>{
        const drivers: Driver[] = [];
        const orders: Order[] = [];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.time).toBe(1);
        expect(state.time).toBe(0);
    })
    it("assigns a created order to the nearest idle driver",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:4},{x:5,y:6},"created",0)];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0].status).toBe("assigned");
        expect(result.orders[0].driverId).toBe("Omar");
        expect(result.drivers[0].status).toBe("busy");
    })
    it("leaves a created order unassigned when no idle driver is available",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"busy")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:4},{x:5,y:6},"created",0)];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0].status).toBe("created");
        expect(result.orders[0].driverId).toBeUndefined();
        expect(result.drivers[0].status).toBe("busy");
    })
    it("Two orders, one idle driver",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:4},{x:5,y:6},"created",0),
            makeOrder("Paneer Roll",{x:2,y:1},{x:3,y:4},"created",0)
        ];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0].status).toBe("assigned");
        expect(result.orders[1].status).toBe("created");
        expect(result.orders[0].driverId).toBe("Omar");
        expect(result.orders[1].driverId).toBeUndefined();
        expect(result.drivers[0].status).toBe("busy");
    })
    it("Two orders, two idle drivers",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle"),
            makeDriver("Slim",4,5,"idle")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:4},{x:5,y:6},"created",0),
            makeOrder("Paneer Roll",{x:2,y:1},{x:3,y:4},"created",0)
        ];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0].status).toBe("assigned");
        expect(result.orders[1].status).toBe("assigned");
        expect(result.orders[0].driverId).toBe("Omar");
        expect(result.orders[1].driverId).toBe("Slim");
        expect(result.drivers[0].status).toBe("busy");
        expect(result.drivers[1].status).toBe("busy");
    })//expect(result.orders.every(order => order.status === "assigned")).toBe(true); to check for both orders at once
    
    it("leaves orders that are not created unchanged", () => {
        const drivers: Driver[] = [
            makeDriver("Omar", 3, 3, "idle")
        ];

        const orders: Order[] = [
            makeOrder("Paneer Roll", {x: 2, y: 1}, {x: 3, y: 4}, "assigned", 0, "Bodie"),
            makeOrder("Cake", {x: 3, y: 1}, {x: 6, y: 7}, "delivered", 0, "Omar"),
            makeOrder("Burger", {x: 5, y: 2}, {x: 6, y: 3}, "cancelled", 0)
        ];

        const state = makeState(0, drivers, orders);
        const result = tick(state);

        expect(result.orders[0].status).toBe("assigned");
        expect(result.orders[1].status).toBe("delivered");
        expect(result.orders[2].status).toBe("cancelled");

        expect(result.orders[0].driverId).toBe("Bodie");
        expect(result.orders[1].driverId).toBe("Omar");
        expect(result.orders[2].driverId).toBeUndefined();

        expect(result.drivers[0].status).toBe("idle");
    })
    it("Input state isn't mutated",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:4},{x:5,y:6},"created",0)];
        const state=makeState(0,drivers,orders);
        expect(state.drivers[0]!.status).toBe("idle");
        expect(state.orders[0]!.status).toBe("created");
        const result=tick(state);
        expect(state.drivers[0]!.status).toBe("idle");
        expect(state.orders[0]!.status).toBe("created");
        expect(state.time).toBe(0);
        expect(result.time).toBe(1);
        expect(result.drivers[0].status).toBe("busy");
        expect(result.orders[0].status).toBe("assigned");

    })//! here is called the non-null assertion operator. You're telling TypeScript: "I'm certain this value isn't undefined."

})

