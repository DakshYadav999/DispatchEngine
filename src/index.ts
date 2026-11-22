import { generateScenario } from "./scenario.js";
import { runSimulation } from "./run.js";

const initial = generateScenario({
    seed: 42, width: 20, height: 20, driverCount: 2, orderCount: 12, duration: 30
});

const result = runSimulation(initial, { maxTicks: 1000 });
console.log(`completed=${result.completed}, ticks=${result.history.length - 1}`);