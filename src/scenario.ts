import { createRng, randomInt, randomPoint } from "./random.js";
import type { Driver, Order, SimulationState } from "./types.js";

export type ScenarioConfig = {
    seed: number;
    width: number;
    height: number;
    driverCount: number;
    orderCount: number;
    duration: number; // orders appear at times 0 .. duration - 1
};

type Rng = () => number;

function assertWholeNumber(name: string, value: number): void {
    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(`${name} must be a whole number >= 0, got ${value}`);
    }
}

export function generateDrivers(
    rng: Rng, count: number, width: number, height: number
): Driver[] {
    const drivers: Driver[] = [];
    for (let i = 0; i < count; i++) {
        drivers.push({
            id: `driver-${i + 1}`,
            location: randomPoint(rng, width, height),
            status: "idle"
        });
    }
    return drivers;
}

export function generateOrders(
    rng: Rng, count: number, width: number, height: number, duration: number
): Order[] {
    const orders: Order[] = [];
    for (let i = 0; i < count; i++) {
        // call order matters for reproducibility: pickup, dropoff, createdAt
        const pickup = randomPoint(rng, width, height);
        const dropoff = randomPoint(rng, width, height);
        const createdAt = randomInt(rng, 0, duration - 1);
        orders.push({
            id: `order-${i + 1}`,
            pickup,
            dropoff,
            status: "created",
            createdAt
        });
    }
    // assignOrders is first-come-first-served in array order, so sort by arrival.
    // Array.sort is stable, so ties keep generation (id) order.
    return orders.sort((a, b) => a.createdAt - b.createdAt);
}

export function generateScenario(config: ScenarioConfig): SimulationState {
    const { seed, width, height, driverCount, orderCount, duration } = config;
    assertWholeNumber("width", width);
    assertWholeNumber("height", height);
    assertWholeNumber("driverCount", driverCount);
    assertWholeNumber("orderCount", orderCount);
    assertWholeNumber("duration", duration);
    if (orderCount > 0 && duration < 1) {
        throw new RangeError("duration must be >= 1 when orderCount > 0");
    }

    // Two independent streams, so changing one count never shifts the other's values.
    const driverRng = createRng(seed);
    const orderRng = createRng(seed ^ 0x9e3779b9);

    return {
        time: 0,
        drivers: generateDrivers(driverRng, driverCount, width, height),
        orders: generateOrders(orderRng, orderCount, width, height, duration)
    };
}