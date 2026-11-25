import { nearestDriverStrategy, type AssignmentStrategy } from "./assignment.js";
import { findNearestDriver } from "./assignment.js";
import type { SimulationState, Order, Driver } from "./types.js";
import { moveToward } from "./geometry.js";

export function tick(
    state: SimulationState,
    driverSpeed: number = 1,
    strategy: AssignmentStrategy = nearestDriverStrategy
): SimulationState {
    const assignedState = assignOrders(state, strategy);
    const movedState = advanceDeliveries(assignedState, driverSpeed);

    return {
        ...movedState,
        time: state.time + 1
    };
}

export function assignOrders(
    state: SimulationState,
    strategy: AssignmentStrategy = nearestDriverStrategy
): SimulationState {
    const waiting = state.orders.filter(
        (o) => o.status === "created" && o.createdAt <= state.time
    );
    const idle = state.drivers.filter((d) => d.status === "idle");

    if (waiting.length === 0 || idle.length === 0) {
        return { ...state };
    }

    const assignments = strategy(waiting, idle, state.time);

    // Never trust a strategy: check its answer before applying it.
    const waitingIds = new Set(waiting.map((o) => o.id));
    const idleIds = new Set(idle.map((d) => d.id));
    const driverByOrder = new Map<string, string>();
    const usedDrivers = new Set<string>();

    for (const a of assignments) {
        if (!waitingIds.has(a.orderId)) {
            throw new Error(`Strategy assigned an order that is not waiting: ${a.orderId}`);
        }
        if (!idleIds.has(a.driverId)) {
            throw new Error(`Strategy assigned a driver that is not idle: ${a.driverId}`);
        }
        if (driverByOrder.has(a.orderId)) {
            throw new Error(`Strategy assigned order twice: ${a.orderId}`);
        }
        if (usedDrivers.has(a.driverId)) {
            throw new Error(`Strategy assigned driver twice: ${a.driverId}`);
        }
        driverByOrder.set(a.orderId, a.driverId);
        usedDrivers.add(a.driverId);
    }

    return {
        ...state,
        drivers: state.drivers.map((d): Driver =>
            usedDrivers.has(d.id) ? { ...d, status: "busy" } : d
        ),
        orders: state.orders.map((o): Order => {
            const driverId = driverByOrder.get(o.id);
            return driverId === undefined
                ? o
                : { ...o, status: "assigned", driverId, assignedAt: state.time };
        })
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
        let idleUpdate: { idleSince?: number } = {};
        
        if (order.status === "assigned" && arrived) {
            newOrderStatus = "picked_up";
            timestamps = { pickedUpAt: completionTime };
        } else if (order.status === "picked_up" && arrived) {
            newOrderStatus = "delivered";
            newDriverStatus = "idle";
            timestamps = { deliveredAt: completionTime };
            idleUpdate = { idleSince: completionTime };
        }

        workingDrivers = workingDrivers.map((currentDriver) => {
            if (currentDriver.id === driver.id) {
                return {
                    ...currentDriver,
                    location: newLocation,
                    status: newDriverStatus,
                    ...idleUpdate
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