
import { findNearestDriver } from "./assignment.js";
import type { SimulationState, Order, Driver } from "./types.js";
import { moveToward } from "./geometry.js";

export function tick(
    state: SimulationState,
    driverSpeed: number = 1
): SimulationState {
    const assignedState = assignOrders(state);
    const movedState = advanceDeliveries(assignedState, driverSpeed);

    return {
        ...movedState,
        time: state.time + 1
    };
}

export function assignOrders(state: SimulationState): SimulationState {
    let workingDrivers = state.drivers;
    const updatedOrders: Order[] = [];

    for (const order of state.orders) {
        if (order.status !== "created" || order.createdAt > state.time) {
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
            driverId: driver.id,
            assignedAt: state.time
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
        drivers: workingDrivers,
        orders: updatedOrders
    };
}

// for...in gives array property keys as strings ("0", "1", etc.).
// for...of gives the actual array elements.
export function advanceDeliveries(
    state: SimulationState,
    driverSpeed: number
): SimulationState {
    const completionTime = state.time + 1;
    let workingDrivers = state.drivers;
    const updatedOrders: Order[] = [];

    for (const order of state.orders) {
        if (order.status !== "assigned" && order.status !== "picked_up") {
            updatedOrders.push(order);
            continue;
        }

        const driver = workingDrivers.find(
            (currentDriver) => currentDriver.id === order.driverId
        );

        if (!driver) {
            updatedOrders.push(order);
            continue;
        }

        const target = order.status === "assigned"
            ? order.pickup
            : order.dropoff;

        const newLocation = moveToward(driver.location, target, driverSpeed);

        const arrived =
            newLocation.x === target.x &&
            newLocation.y === target.y;

        let newOrderStatus: Order["status"] = order.status;
        let newDriverStatus: Driver["status"] = driver.status;
        let timestamps: { pickedUpAt?: number; deliveredAt?: number } = {};

        if (order.status === "assigned" && arrived) {
            newOrderStatus = "picked_up";
            timestamps = { pickedUpAt: completionTime };
        } else if (order.status === "picked_up" && arrived) {
            newOrderStatus = "delivered";
            newDriverStatus = "idle";
            timestamps = { deliveredAt: completionTime };
        }

        workingDrivers = workingDrivers.map((currentDriver) => {
            if (currentDriver.id === driver.id) {
                return {
                    ...currentDriver,
                    location: newLocation,
                    status: newDriverStatus
                };
            }
            return currentDriver;
        });

        updatedOrders.push({
            ...order,
            status: newOrderStatus,
            ...timestamps
        });
    }

    return {
        ...state,
        drivers: workingDrivers,
        orders: updatedOrders
    };
}