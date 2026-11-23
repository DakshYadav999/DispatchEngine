import type { RunResult } from "./run.js";

export type Metrics = {
    totalOrders: number;
    delivered: number;
    cancelled: number;
    inProgress: number;      // assigned or picked up
    unassigned: number;      // arrived but never assigned
    notYetArrived: number;   // createdAt is after the final time
    avgAssignmentDelay: number | null;  // assignedAt - createdAt
    avgTimeToPickup: number | null;     // pickedUpAt - createdAt
    avgDeliveryTime: number | null;     // deliveredAt - createdAt
    maxDeliveryTime: number | null;
    driverUtilization: number | null;   // busy driver-ticks / available driver-ticks
    ticks: number;
    completed: boolean;
};

// An average of nothing is "unknown", not 0.
function mean(values: number[]): number | null {
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeMetrics(result: RunResult): Metrics {
    const { history, finalState, completed } = result;

    let delivered = 0;
    let cancelled = 0;
    let inProgress = 0;
    let unassigned = 0;
    let notYetArrived = 0;
    const assignmentDelays: number[] = [];
    const pickupTimes: number[] = [];
    const deliveryTimes: number[] = [];

    for (const order of finalState.orders) {
        if (order.status === "delivered") delivered++;
        else if (order.status === "cancelled") cancelled++;
        else if (order.status === "assigned" || order.status === "picked_up") inProgress++;
        else if (order.createdAt > finalState.time) notYetArrived++;
        else unassigned++;

        if (order.assignedAt !== undefined) {
            assignmentDelays.push(order.assignedAt - order.createdAt);
        }
        if (order.pickedUpAt !== undefined) {
            pickupTimes.push(order.pickedUpAt - order.createdAt);
        }
        if (order.deliveredAt !== undefined) {
            deliveryTimes.push(order.deliveredAt - order.createdAt);
        }
    }

    // Utilization: look at the state after every tick (history[0] is the start, so skip it).
    // Offline drivers aren't available, so they're excluded from the denominator.
    let busyStates = 0;
    let availableStates = 0;
    for (const state of history.slice(1)) {
        for (const driver of state.drivers) {
            if (driver.status === "offline") continue;
            availableStates++;
            if (driver.status === "busy") busyStates++;
        }
    }

    return {
        totalOrders: finalState.orders.length,
        delivered,
        cancelled,
        inProgress,
        unassigned,
        notYetArrived,
        avgAssignmentDelay: mean(assignmentDelays),
        avgTimeToPickup: mean(pickupTimes),
        avgDeliveryTime: mean(deliveryTimes),
        maxDeliveryTime: deliveryTimes.length === 0 ? null : Math.max(...deliveryTimes),
        driverUtilization: availableStates === 0 ? null : busyStates / availableStates,
        ticks: history.length - 1,
        completed
    };
}