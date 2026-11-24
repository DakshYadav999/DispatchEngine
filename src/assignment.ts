import { distance } from "./geometry.js";
import type { Driver, Order } from "./types.js";

export function findNearestDriver(drivers:Driver[],order:Order):Driver | undefined{
    let best:Driver | undefined=undefined;
    let bestDistance=Infinity;

   for (const driver of drivers) {
        if(driver.status!=="idle"){
            continue;
        }
        const currentDistance=distance(driver.location,order.pickup);

        if(currentDistance<bestDistance){
            best=driver;
            bestDistance=currentDistance;
        }
    }
    return best;
}

export type Assignment = { orderId: string; driverId: string };

export type AssignmentStrategy = (
    waitingOrders: Order[],
    idleDrivers: Driver[],
    time: number
) => Assignment[];

// Greedy: orders in array order (first come, first served), each takes the nearest free driver.
export const nearestDriverStrategy: AssignmentStrategy = (waitingOrders, idleDrivers) => {
    let available = idleDrivers;
    const assignments: Assignment[] = [];

    for (const order of waitingOrders) {
        const driver = findNearestDriver(available, order);
        if (driver === undefined) continue;
        assignments.push({ orderId: order.id, driverId: driver.id });
        available = available.filter((d) => d.id !== driver.id);
    }

    return assignments;
};