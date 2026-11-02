# DispatchLab: Project Context

## Vision

A dispatch simulator: drivers and delivery orders on a map, assignment strategies compared with real measured metrics. Portfolio project for SDE-1.

## Stack

- Engine: TypeScript, Vitest (current)
- Frontend: React + Vite, canvas first, Leaflet later
- Backend: Node + Express, PostgreSQL + Prisma, Socket.IO (later)

## Current Structure

```text
dispatch-engine/
  src/
    index.ts
    geometry.ts          Point, distance, moveToward
    geometry.test.ts     Geometry and movement tests
    types.ts             Driver, Order, SimulationState, status unions
    assignment.ts        findNearestDriver
    assignment.test.ts   Assignment tests
    simulation.ts        assignOrders, advanceDeliveries, tick
    simulation.test.ts   Simulation tests
```

## Decisions

### Architecture

- Engine is pure TypeScript with no web or Node specifics, so it can be reused by frontend and backend.
- Strategies are pure functions that return a decision; the simulation applies it.
- Ties are broken by array order (first wins) to keep runs deterministic.
- ES modules; relative imports end in `.js`; `import type` for types.
- Frontend before backend; Redis/Kafka/H3 only if a real need appears.

### Assignment

- `findNearestDriver` selects the nearest idle driver to an order's pickup.
- Busy and offline drivers are ignored.
- Orders are processed in array order.
- Once assigned, a driver becomes busy and cannot receive another order until available again.

### Movement

- `moveToward(from, to, maxStep)` moves a point toward a target by at most `maxStep`.
- It reuses `distance()` and uses a normalized direction vector.
- It returns the exact target coordinates when the remaining distance is less than or equal to `maxStep`, preventing overshooting.
- Movement functions return new Point objects and do not mutate their inputs.

### Simulation Tick (Task 7 decision)

Each tick follows this fixed phase order:

1. Assign waiting orders to available idle drivers.
2. Move drivers toward their current targets.
3. Update order and driver statuses when a driver arrives.
4. Increment simulation time exactly once.

Consequences of this ordering:

- A driver assigned during the current tick can start moving during that same tick.
- A driver who delivers an order during the current tick cannot receive another order until the next tick because assignment has already happened.
- A driver arriving at a pickup becomes `picked_up` but does not begin moving toward the dropoff until the next tick.
- Arrival and pickup/delivery status changes take no additional time.

### Order and Driver Relationship

- `order.driverId` identifies the driver assigned to an order.
- The order is the source of truth for the driver-order relationship.
- No `orderId` is added to the Driver type to avoid duplicating relationship state.
- During delivery advancement, the driver is located using `order.driverId`.
- If the referenced driver does not exist, the order is left unchanged rather than crashing.

### Status Transitions

```text
created
   |
   v
assigned
   |
   v
picked_up
   |
   v
delivered
```

- `created`: waiting for assignment.
- `assigned`: driver is travelling toward the pickup.
- `picked_up`: driver is travelling toward the dropoff.
- `delivered`: driver has reached the dropoff and becomes idle.
- `cancelled`: no movement or delivery processing.

### Tick Function

- `tick(state, driverSpeed = 1)` advances the simulation by one time unit.
- The default speed is 1.
- `assignOrders` handles assignment without changing simulation time.
- `advanceDeliveries` handles movement and arrival status changes without changing simulation time.
- `tick` composes these functions and increments time once.

## Status

**Completed:**
- Project setup and TypeScript configuration.
- Point type and distance calculation.
- Driver, Order and SimulationState types.
- `findNearestDriver` and its tests.
- Initial simulation state and Task 5 assignment tick.
- `moveToward` and its movement tests.

**In progress:**
- Task 7: Refactor assignment into `assignOrders`.
- Implement `advanceDeliveries`.
- Update `tick` to compose assignment and delivery advancement.
- Add movement, arrival, full-journey and immutability tests.
- Update existing Task 5 tests to account for same-tick movement.

## Next

Complete Task 7 and verify:

- All tests pass.
- TypeScript typecheck passes.
- A complete journey from `(0,0)` to pickup `(3,0)` to dropoff `(3,4)` takes exactly 7 ticks at speed 1.
- Inputs are never mutated.

## Known Limitations

- Straight-line distance on a flat grid, no roads.
- Greedy nearest-driver assignment only.
- No real GPS or traffic-aware ETA.
- No concurrent order processing.

## Out of Scope for the MVP

- Authentication.
- ML-based ETAs.
- Real GPS integration.
- Microservices.
- Redis, Kafka and H3 unless a real need appears.
