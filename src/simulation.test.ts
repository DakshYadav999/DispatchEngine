import { describe, it, expect } from "vitest";  
import type { SimulationState } from "./types.js";
import { advanceDeliveries, assignOrders, tick } from "./simulation.js";
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
        expect(result.drivers).toEqual(drivers);
        expect(result.orders).toEqual(orders);
    })
    it("assigns a created order to the nearest idle driver",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:5},{x:5,y:6},"created",0)];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0]!.status).toBe("assigned");
        expect(result.orders[0]!.driverId).toBe("Omar");
        expect(result.drivers[0]!.status).toBe("busy");
    })
    it("leaves a created order unassigned when no idle driver is available",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"busy")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:4},{x:5,y:6},"created",0)];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0]!.status).toBe("created");
        expect(result.orders[0]!.driverId).toBeUndefined();
        expect(result.drivers[0]!.status).toBe("busy");
    })
    it("Two orders, one idle driver",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:5},{x:5,y:6},"created",0),
            makeOrder("Paneer Roll",{x:2,y:1},{x:3,y:4},"created",0)
        ];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0]!.status).toBe("assigned");
        expect(result.orders[1]!.status).toBe("created");
        expect(result.orders[0]!.driverId).toBe("Omar");
        expect(result.orders[1]!.driverId).toBeUndefined();
        expect(result.drivers[0]!.status).toBe("busy");
    })
    it("Two orders, two idle drivers",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle"),
            makeDriver("Slim",4,5,"idle")];
        const orders: Order[] = [
            makeOrder("Shawarma", {x:2,y:4}, {x:5,y:6}, "created", 0),
            makeOrder("Paneer Roll", {x:2,y:1}, {x:3,y:4}, "created", 0)
        ];
        const state=makeState(0,drivers,orders);
        const result=tick(state);
        expect(result.orders[0]!.status).toBe("assigned");
        expect(result.orders[1]!.status).toBe("assigned");
        expect(result.orders[0]!.driverId).toBe("Omar");
        expect(result.orders[1]!.driverId).toBe("Slim");
        expect(result.drivers[0]!.status).toBe("busy");
        expect(result.drivers[1]!.status).toBe("busy");
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

        expect(result.orders[0]!.status).toBe("assigned");
        expect(result.orders[1]!.status).toBe("delivered");
        expect(result.orders[2]!.status).toBe("cancelled");

        expect(result.orders[0]!.driverId).toBe("Bodie");
        expect(result.orders[1]!.driverId).toBe("Omar");
        expect(result.orders[2]!.driverId).toBeUndefined();

        expect(result.drivers[0]!.status).toBe("idle");
    })
    it("Input state isn't mutated",()=>{
        const drivers: Driver[] = [makeDriver("Omar",3,3,"idle")];
        const orders: Order[] = [makeOrder("Shawarma",{x:3,y:5},{x:5,y:6},"created",0)];
        const state=makeState(0,drivers,orders);
        expect(state.drivers[0]!.status).toBe("idle");
        expect(state.orders[0]!.status).toBe("created");
        const result=tick(state);
        expect(state.drivers[0]!.status).toBe("idle");
        expect(state.orders[0]!.status).toBe("created");
        expect(state.time).toBe(0);
        expect(result.time).toBe(1);
        expect(result.drivers[0]!.status).toBe("busy");
        expect(result.orders[0]!.status).toBe("assigned");

    })

})

describe("assignOrders", () => {
    it("assigns a created order and leaves time unchanged", () => {
        const drivers: Driver[] = [
            makeDriver("Omar", 0, 0, "idle")
        ];

        const orders: Order[] = [
            makeOrder(
                "Shawarma",
                { x: 3, y: 0 },
                { x: 8, y: 0 },
                "created",
                0
            )
        ];

        const state = makeState(10, drivers, orders);

        const result = assignOrders(state);

        expect(result.orders[0]!.status).toBe("assigned");
        expect(result.orders[0]!.driverId).toBe("Omar");
        expect(result.drivers[0]!.status).toBe("busy");
        expect(result.time).toBe(10);
    });

    it("does not mutate the original state", () => {
        const state = makeState(
            10,
            [makeDriver("Omar", 0, 0, "idle")],
            [
                makeOrder(
                    "Shawarma",
                    { x: 3, y: 0 },
                    { x: 8, y: 0 },
                    "created",
                    0
                )
            ]
        );

        const snapshot = structuredClone(state);

        assignOrders(state);

        expect(state).toEqual(snapshot);
    });
});

describe("advanceDeliveries",()=>{
    it("A driver moves one step towards the pickup, while the order remains assigned",()=>{
        const drivers:Driver[]=[makeDriver("Omar",0,0,"busy")];
        const orders:Order[]=[makeOrder("Shawarma",{x:5,y:0},{x:10,y:0},"assigned",0,"Omar")];
        const state=makeState(0,drivers,orders);
        const result=advanceDeliveries(state,1);
        expect(result.drivers[0]!.location).toEqual({x:1,y:0})
        expect(result.orders[0]!.status).toBe("assigned")
        expect(result.drivers[0]!.status).toBe("busy")
    })
    it("Changes order to picked_up when driver arrives at pickup", () => {
        const drivers: Driver[] = [makeDriver("Omar", 4, 0, "busy")];
        const orders: Order[] = [
            makeOrder("Shawarma", {x:5,y:0}, {x:10,y:0}, "assigned", 0, "Omar")
        ];
        const state = makeState(0, drivers, orders);

        const result = advanceDeliveries(state, 1);

        expect(result.drivers[0]!.location).toEqual({x:5,y:0});
        expect(result.orders[0]!.status).toBe("picked_up");
        expect(result.drivers[0]!.status).toBe("busy");
    })
    it("Moves driver towards dropoff after pickup", () => {
        const drivers: Driver[] = [makeDriver("Omar", 5, 0, "busy")];
        const orders: Order[] = [
            makeOrder("Shawarma", {x:2,y:0}, {x:10,y:0}, "picked_up", 0, "Omar")
        ];
        const state = makeState(0, drivers, orders);

        const result = advanceDeliveries(state, 1);

        expect(result.drivers[0]!.location).toEqual({x:6,y:0});
        expect(result.orders[0]!.status).toBe("picked_up");
        expect(result.drivers[0]!.status).toBe("busy");
    })
it("Marks order delivered and driver idle at dropoff", () => {
    const drivers: Driver[] = [makeDriver("Omar", 9, 0, "busy")];
    const orders: Order[] = [
        makeOrder("Shawarma", {x:2,y:0}, {x:10,y:0}, "picked_up", 0, "Omar")
    ];
    const state = makeState(0, drivers, orders);

    const result = advanceDeliveries(state, 1);

    expect(result.drivers[0]!.location).toEqual({x:10,y:0});
    expect(result.orders[0]!.status).toBe("delivered");
    expect(result.drivers[0]!.status).toBe("idle");
});
it("Does not overshoot the target", () => {
    const drivers: Driver[] = [makeDriver("Omar", 0, 0, "busy")];
    const orders: Order[] = [
        makeOrder("Shawarma", {x:2,y:0}, {x:10,y:0}, "assigned", 0, "Omar")
    ];
    const state = makeState(0, drivers, orders);

    const result = advanceDeliveries(state, 5);

    expect(result.drivers[0]!.location).toEqual({x:2,y:0});
    expect(result.orders[0]!.status).toBe("picked_up");
});
it("Changes to picked_up if driver is already at pickup", () => {
    const drivers: Driver[] = [makeDriver("Omar", 5, 0, "busy")];
    const orders: Order[] = [
        makeOrder("Shawarma", {x:5,y:0}, {x:10,y:0}, "assigned", 0, "Omar")
    ];
    const state = makeState(0, drivers, orders);

    const result = advanceDeliveries(state, 1);

    expect(result.orders[0]!.status).toBe("picked_up");
    expect(result.drivers[0]!.location).toEqual({x:5,y:0});
    expect(result.drivers[0]!.status).toBe("busy");
});
it("Completes the full journey in exactly 7 ticks", () => {
    const drivers: Driver[] = [makeDriver("Omar", 0, 0, "idle")];
    const orders: Order[] = [
        makeOrder("Shawarma", {x:3,y:0}, {x:3,y:4}, "created", 0)
    ];
    let state = makeState(0, drivers, orders);

    for (let i = 0; i < 6; i++) {
        state = tick(state, 1);
    }

    expect(state.orders[0]!.status).not.toBe("delivered");

    state = tick(state, 1);

    expect(state.orders[0]!.status).toBe("delivered");
    expect(state.drivers[0]!.status).toBe("idle");
    expect(state.time).toBe(7);
});

it("Allows a driver to take another order after delivery", () => {
    const drivers: Driver[] = [makeDriver("Omar", 0, 0, "idle")];
    const orders: Order[] = [
        makeOrder("Shawarma", {x:1,y:0}, {x:2,y:0}, "created", 0)
    ];
    let state = makeState(0, drivers, orders);

    state = tick(state, 1);
    state = tick(state, 1);

    expect(state.orders[0]!.status).toBe("delivered");
    expect(state.drivers[0]!.status).toBe("idle");

    const newOrder = makeOrder(
        "Burger", {x:3,y:0}, {x:5,y:0}, "created", 2
    );

    state = {
        ...state,
        orders: [...state.orders, newOrder]
    };

    state = tick(state, 1);

    expect(state.orders[1]!.status).toBe("picked_up");
    expect(state.orders[1]!.driverId).toBe("Omar");
    expect(state.drivers[0]!.status).toBe("busy");
});
it("Reaches a diagonal pickup in exactly 5 ticks", () => {
    let state = makeState(
        0,
        [makeDriver("Omar", 0, 0, "busy")],
        [
            makeOrder(
                "Diagonal Order",
                { x: 3, y: 4 },
                { x: 8, y: 9 },
                "assigned",
                0,
                "Omar"
            )
        ]
    );

    let ticks = 0;

    while (state.orders[0]!.status !== "picked_up" && ticks < 6) {
        state = advanceDeliveries(state, 1);
        ticks++;
    }

    expect(ticks).toBe(5);
    expect(state.orders[0]!.status).toBe("picked_up");
    expect(state.drivers[0]!.location).toEqual({ x: 3, y: 4 });
});
it("Does not move idle or offline drivers", () => {
    const drivers: Driver[] = [
        makeDriver("Omar", 0, 0, "busy"),
        makeDriver("Slim", 10, 10, "idle"),
        makeDriver("Max", 20, 20, "offline")
    ];

    const orders: Order[] = [
        makeOrder(
            "Shawarma",
            { x: 5, y: 0 },
            { x: 10, y: 0 },
            "assigned",
            0,
            "Omar"
        )
    ];

    const state = makeState(0, drivers, orders);

    const result = advanceDeliveries(state, 1);

    expect(result.drivers[0]!.location).toEqual({ x: 1, y: 0 });
    expect(result.drivers[1]!.location).toEqual({ x: 10, y: 10 });
    expect(result.drivers[2]!.location).toEqual({ x: 20, y: 20 });
});
it("Does not mutate the original state", () => {
    const drivers: Driver[] = [makeDriver("Omar", 0, 0, "busy")];
    const orders: Order[] = [
        makeOrder("Shawarma", {x:5,y:0}, {x:10,y:0}, "assigned", 0, "Omar")
    ];
    const state = makeState(0, drivers, orders);

    const snapshot = structuredClone(state);

    advanceDeliveries(state, 1);

    expect(state).toEqual(snapshot);
});
})
