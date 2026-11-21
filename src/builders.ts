import type { Point } from "./geometry.js";
import type { Driver, Order, SimulationState } from "./types.js";

function assertPoint(name: string, p: Point): void {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        throw new RangeError(`${name} must have finite x and y`);
    }
}

export function createEmptyState(): SimulationState {
    return { time: 0, drivers: [], orders: [] };
}

export function addDriver(
    state: SimulationState,
    input: { id: string; location: Point }
): SimulationState {
    if (state.drivers.some((d) => d.id === input.id)) {
        throw new Error(`Duplicate driver id: ${input.id}`);
    }
    assertPoint("location", input.location);

    const driver: Driver = {
        id: input.id,
        location: { x: input.location.x, y: input.location.y }, // copy, don't share
        status: "idle"
    };
    return { ...state, drivers: [...state.drivers, driver] };
}

export function addOrder(
    state: SimulationState,
    input: { id: string; pickup: Point; dropoff: Point; createdAt?: number }
): SimulationState {
    if (state.orders.some((o) => o.id === input.id)) {
        throw new Error(`Duplicate order id: ${input.id}`);
    }
    assertPoint("pickup", input.pickup);
    assertPoint("dropoff", input.dropoff);

    const createdAt = input.createdAt ?? state.time;
    if (!Number.isInteger(createdAt) || createdAt < 0) {
        throw new RangeError(`createdAt must be a whole number >= 0, got ${createdAt}`);
    }

    const order: Order = {
        id: input.id,
        pickup: { x: input.pickup.x, y: input.pickup.y },
        dropoff: { x: input.dropoff.x, y: input.dropoff.y },
        status: "created",
        createdAt
    };

    // Keep orders sorted by createdAt (new order goes after existing ones with the same time)
    const orders = [...state.orders];
    const index = orders.findIndex((o) => o.createdAt > createdAt);
    orders.splice(index === -1 ? orders.length : index, 0, order);

    return { ...state, orders };
}