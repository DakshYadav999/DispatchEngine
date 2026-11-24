import { tick } from "./simulation.js";
import type { SimulationState } from "./types.js";
import { nearestDriverStrategy, type AssignmentStrategy } from "./assignment.js";

export type RunOptions = {
    maxTicks: number;
    driverSpeed?: number;
    strategy?: AssignmentStrategy;
};

export type RunResult = {
    history: SimulationState[]; // history[i] is the state after i ticks (history[0] = start)
    finalState: SimulationState;
    completed: boolean;         // true if every order was delivered or cancelled
};

export function isFinished(state: SimulationState): boolean {
    return state.orders.every(
        (o) => o.status === "delivered" || o.status === "cancelled"
    );
}

export function runSimulation(
    initial: SimulationState,
    options: RunOptions
): RunResult {
    const { maxTicks, driverSpeed = 1 , strategy = nearestDriverStrategy } = options;

    if (!Number.isInteger(maxTicks) || maxTicks < 0) {
        throw new RangeError(`maxTicks must be a whole number >= 0, got ${maxTicks}`);
    }
    if (!Number.isFinite(driverSpeed) || driverSpeed <= 0) {
        throw new RangeError(`driverSpeed must be > 0, got ${driverSpeed}`);
    }

    const history: SimulationState[] = [initial];
    let state = initial;

    while (history.length - 1 < maxTicks && !isFinished(state)) {
        state = tick(state, driverSpeed, strategy);
        history.push(state);
    }

    return { history, finalState: state, completed: isFinished(state) };
}