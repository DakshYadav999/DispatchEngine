import { findNearestDriver } from "./assignment.js";
import type { SimulationState, Order } from "./types.js";

export function tick(state: SimulationState): SimulationState {
    let workingDrivers = state.drivers;
    const updatedOrders: Order[] = [];

    for (const order of state.orders) {
        if (order.status !== "created") {
            updatedOrders.push(order);
            continue;
        }

        const driver = findNearestDriver(workingDrivers, order);

        if (!driver) {
            updatedOrders.push(order);
            continue;
        }

        const assignedOrder: Order = {
            ...order,
            status: "assigned",
            driverId: driver.id
        };

        workingDrivers = workingDrivers.map((currentDriver) => {
            if (currentDriver.id === driver.id) {
                return {
                    ...currentDriver,
                    status: "busy"
                };
            }

            return currentDriver;
        });

        updatedOrders.push(assignedOrder);
    }

    return {
        ...state,
        time: state.time + 1,
        drivers: workingDrivers,
        orders: updatedOrders
    };
}