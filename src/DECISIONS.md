# DispatchLab: Design Decisions (Tasks 1-12)

Format for each decision: what we chose, why, what else we could have done, and a one-line interview answer.
Tip: rewrite a few of these in your own words. That is what makes them yours.

---

## Architecture

**The engine is pure TypeScript with no web or Node specifics.**
- Why: the same engine can run in a terminal, in Node (backend) and in the browser (frontend), and it is easy to test because there is no I/O.
- Alternative: write the logic inside Express routes or React components. Rejected because it mixes logic with plumbing and makes testing painful.
- Interview line: "The dispatch logic is a pure function from state to state. The server, database and UI are wrappers around it."

**Frontend before backend; Redis, Kafka, H3 and ML only if a real need appears.**
- Why: a visual result early keeps motivation up, and extra infrastructure adds weight without solving a problem we have.
- Interview line: "I chose not to add Kafka or Redis because nothing in the project needed them. I can describe where they would fit at larger scale."

---

## Task 2: Distance

**Straight-line (Euclidean) distance on a flat grid.**
- Why: simple and good enough for a simulator. Everything goes through one function, so it can be swapped later.
- Alternatives: Manhattan distance, or real road networks (graph and shortest path).
- Limitation to state openly: real delivery moves along roads, with traffic.

---

## Task 3: Types

**Statuses are union types (`"idle" | "busy" | "offline"`), not plain strings.**
- Why: a typo like `"idel"` becomes a compile error instead of a silent bug.
- Alternative: enums. Unions are simpler and compile to nothing.

**`Order` has `pickup` and `dropoff`; `Driver` has one `location`.**
- Why: an order is a trip with two points, while a driver is just somewhere right now.

---

## Task 4: findNearestDriver

**Returns `Driver | undefined`.**
- Why: "no driver available" is a normal outcome, and the type forces every caller to handle it.

**One pass with a running best (O(n)), not filter-then-sort (O(n log n)).**
- Why: we only need the minimum.

**Ties go to the driver earlier in the array.**
- Why: a fixed rule keeps runs deterministic, which makes strategy comparisons fair.

**It is a pure function: it decides and never mutates.**
- Why: easy to test, and the simulation decides when to apply the result.

**Greedy is not always optimal.**
- A driver taken by one order might have been the best choice for another. This is what the global-matching strategy will address.

---

## Task 5: tick and immutable state

**`tick` returns a new state and never mutates its input.**
- Why: before-and-after comparison in tests, free history and replay, no accidental shared references, and React relies on it later.
- Alternative: mutate in place. It is faster and simpler, but harder to test and replay.

**A working copy of the drivers is kept inside the assignment loop.**
- Why: with two orders and one idle driver, the second order must see that driver as busy. Without the working copy, one driver gets double-booked in the same tick.
- Interview line: "It's the same class of bug as two requests claiming one seat in a booking system."

**Orders are processed in array order (first come, first served), and driver ids are assumed unique.**
- Why: keeps runs deterministic.

---

## Task 6: moveToward

**It returns the exact target when the remaining distance is at most one step.**
- Why: it prevents overshoot and jitter, it avoids dividing by zero when the points are equal, and it makes "arrived" a reliable equality check despite floating-point rounding.

---

## Task 7: Order lifecycle

**Each tick runs in phases: assign orders, move drivers, then advance the clock.**
- Consequence: a driver assigned this tick also moves this tick, and a driver who delivers this tick is available at the next tick's assignment.
- Why write it down: the order of phases changes the numbers the simulation produces.

**The order stores `driverId`; the driver does not store an order id.**
- Why: one source of truth. Two linked fields can disagree after a bug.
- Cost: finding a driver's current job means searching the orders. Fine at this scale.

**Status flow: created, assigned, picked_up, delivered (or cancelled).**

**Known limitation:** an order assigned to a missing or offline driver stays stuck forever.

---

## Task 8: Seeded randomness

**A seeded generator (mulberry32) instead of `Math.random`.**
- Why: reproducible bugs, fair strategy comparisons on identical inputs, and stable tests.
- Rule: no `Math.random` anywhere in the engine. Randomness is always passed in.

**The generator is a closure.**
- It remembers its hidden state between calls, and two generators do not interfere with each other.

**`randomInt` includes both ends, so the range size is `max - min + 1`.**
- The coverage test (every value from `min` to `max` appears) is what catches an off-by-one.

**Integer coordinates, inclusive of the maximum.**

**Not for security.** It is predictable by design.

---

## Task 9: Scenarios and builders

**All orders are generated up front, with future `createdAt` times. `assignOrders` ignores orders whose `createdAt` is later than the current time.**
- Why: the whole scenario lives in one state object, which makes saving, replaying and comparing easy.
- Cost: every function that reads orders must remember to respect time.

**Drivers and orders use separate random streams.**
- Why: if they shared one stream, changing `driverCount` would change every order, and strategy comparisons would no longer be fair. Tests check this directly.
- The second stream's seed is XORed with a constant. Using `seed + 1` would make seed 4's order stream equal to seed 5's driver stream.

**Orders are sorted by `createdAt`.**
- Why: assignment is first come, first served in array order, so array order must equal arrival order. `Array.sort` is stable, so ties stay deterministic.

**Builders (`addDriver`, `addOrder`) return new states, copy the points they are given, reject duplicate ids and reject bad coordinates.**
- Why: ids must be unique because drivers are looked up by id. Copying stops the caller changing their object later and silently altering the simulation. Failing fast at the boundary is easier to debug than `NaN` deep inside a run.

**Random, manual and mixed worlds are all just a `SimulationState`.**
- That is why "random drivers with manual orders" needed no extra code.

**`??` instead of `||` for the `createdAt` default.**
- `||` would treat `0` as missing and replace it.

---

## Task 10: runSimulation

**`maxTicks` limits the run.**
- Why: termination is not guaranteed. With no drivers, or a stuck order, a run would loop forever. With the limit it ends with `completed: false`, so a cut-off run is never mistaken for a success.

**`history[0]` is the starting state, so `history.length - 1` is the number of ticks run.**

**The full history is stored.**
- Why: metrics read it and the UI will replay it. It is safe because states are never mutated.
- Cost: memory grows with ticks times state size. If it mattered, keep periodic snapshots or just the events.

**An invariant is checked at every step: the number of busy drivers equals the number of orders in progress.**
- It catches double-booked drivers and drivers who are never freed.

---

## Task 11: Metrics

**Timestamps live on each order: `assignedAt`, `pickedUpAt`, `deliveredAt`.**
- Why: a final state says an order is delivered, but not when. Without timestamps no delay can be computed.
- Alternative: an event log, which is more flexible and gives an audit trail.

**Assignment uses `state.time`; pickup and delivery use `state.time + 1`.**
- Why: assignment happens at the start of a tick, and arrival is complete by the end of it. That is why a 7-tick journey records 0, 3 and 7.

**Three durations, all measured from `createdAt`:** assignment delay (waiting for a driver), time to pickup, and delivery time (the customer's whole wait).

**A missing average is `null`, not 0.**
- Why: zero would look like a perfect result. `null` means "no data".

**Utilization skips `history[0]` and excludes offline drivers.**
- Why: the starting state is not a tick, and offline drivers cannot take work.

**Orders that have not arrived yet are counted separately from orders that arrived and found no driver.**
- Why: mixing them would make a strategy look worse than it is.

**A mean alone is not enough.** It hides spikes, so we also track the maximum, and later percentiles across many seeds.

---

## Task 12: Pluggable strategies

**A strategy receives all waiting orders, all idle drivers and the time, and returns a list of `{ orderId, driverId }` pairs. It never changes state.**
- Why: a global matching algorithm needs the whole picture, and greedy is just a loop over the same inputs. Keeping strategies pure means the engine is the only thing that mutates the world, so the invariants are enforced in one place.
- Pattern name: the strategy pattern.

**The engine validates every strategy's answer: no unknown orders, no non-idle drivers, no driver or order used twice.**
- Why: a strategy is untrusted input. A bug would otherwise silently corrupt every later tick. Failing loudly at the boundary makes it findable.
- Proof: removing the driver check makes the "one driver for two orders" test fail.

**`nearestDriverStrategy` is the default, and it reproduces the old behavior exactly.**
- Why: that is the proof the refactor is safe. All older tests passed unedited.

**Complexity:** the greedy strategy is O(m times n) for m orders and n idle drivers, and validation uses sets and maps, so it is linear.

---

## Known limitations (state these openly in the README)

- Straight-line distance on a flat grid, with no roads or traffic.
- Synthetic demand and supply. Results describe the simulated scenarios, not real platforms.
- A single-process deterministic simulation. It has no concurrency problems, so do not claim to have solved concurrency.
- No driver rejections, prep times or GPS noise yet.
- An order assigned to a missing or offline driver gets stuck (planned fix: offline drivers and cancellations).
- Any claimed improvement depends on the scenarios and the number of seeds tested.

---

## Roadmap from here

1. Task 13: a smarter scoring strategy and a global matching strategy.
2. Task 14: compare all strategies on the same seeds, across many seeds, in a results table.
3. Convert to a small monorepo, then the web page with a canvas replay.
4. Express and PostgreSQL to save runs.
5. Deployment and a README with measured results.

