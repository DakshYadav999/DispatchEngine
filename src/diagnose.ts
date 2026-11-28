import { generateScenario } from "./scenario.js";
import { runSimulation } from "./run.js";

const config = { seed: 1, width: 20, height: 20, driverCount: 6, orderCount: 40, duration: 60 };
const { history } = runSimulation(generateScenario(config), { maxTicks: 2000 });

let decisionTicks = 0;   // ticks where an assignment decision was possible
let realChoiceTicks = 0; // ticks where there were 2+ idle drivers to choose between

for (const s of history.slice(0, -1)) {
    const waiting = s.orders.filter((o) => o.status === "created" && o.createdAt <= s.time).length;
    const idle = s.drivers.filter((d) => d.status === "idle").length;
    if (waiting > 0 && idle > 0) {
        decisionTicks++;
        if (idle >= 2) realChoiceTicks++;
    }
}

console.log({ decisionTicks, realChoiceTicks });