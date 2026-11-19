# DispatchLab — Project Context

## 1. Project Vision

DispatchLab is a last-mile delivery dispatch simulator.

The goal is to simulate drivers and delivery orders in a city-like environment, assign suitable drivers to orders, visualize their movement, and eventually compare different dispatch strategies using measurable performance metrics.

**Project positioning:**

A last-mile delivery dispatch simulator that evaluates driver assignment strategies under changing demand and fleet availability.

The project is intended to demonstrate practical software engineering, TypeScript, backend fundamentals, simulation logic, and problem-solving for SDE-1 roles.

## 2. Current Technology Stack

### Current implementation
- TypeScript
- Node.js
- Vitest
- tsx

### Planned technologies
- React + TypeScript + Vite for the frontend
- Leaflet + OpenStreetMap for map visualization
- Node.js + Express + TypeScript for the backend
- PostgreSQL + Prisma for persistence
- Zod for validation
- Socket.IO for real-time updates, if needed

Do not introduce technologies just to make the project look more advanced. Add them when the project genuinely needs them.

## 3. Current Project Structure

```text
dispatch-engine/
├── src/
│   ├── geometry.ts
│   ├── types.ts
│   ├── assignment.ts
│   ├── simulation.ts
│   ├── geometry.test.ts
│   ├── assignment.test.ts
│   └── simulation.test.ts
├── package.json
├── tsconfig.json
└── PROJECT_CONTEXT.md
```

## 4. Core Types

### Point
Represents a position in the simulation using `x` and `y` coordinates.

### Driver
Contains:
- `id`
- `location`
- `status`

Driver statuses:
- `idle`
- `busy`
- `offline`

### Order
Contains:
- `id`
- `pickup`
- `dropoff`
- `status`
- `createdAt`
- Optional `driverId`

Order statuses:

`created → assigned → picked_up → delivered`

Orders can also have a `cancelled` status.

The order's `driverId` is the source of truth for its assigned driver. We do not maintain a separate `orderId` on the Driver.

### SimulationState
Contains:
- `time`
- `drivers`
- `orders`

## 5. Implemented Functionality

### Geometry — `geometry.ts`

**`distance(a, b)`**
- Calculates Euclidean distance between two points.

**`moveToward(from, to, maxStep)`**
- Moves a point towards a target by at most `maxStep`.
- Uses the distance function.
- Calculates a normalized direction.
- Prevents overshooting the destination.
- Returns the exact target when the remaining distance is less than or equal to the maximum step.
- Does not mutate the original points.

### Driver Assignment — `assignment.ts`

**`findNearestDriver(drivers, order)`**
- Finds the nearest eligible idle driver to an order's pickup.
- Ignores busy and offline drivers.
- Returns `undefined` if no eligible driver exists.
- Keeps the first driver in case of equal distances.

### Simulation — `simulation.ts`

**`assignOrders(state)`**
- Processes orders with `created` status.
- Finds the nearest idle driver.
- Assigns the driver to the order.
- Changes the order status to `assigned`.
- Changes the driver's status to `busy`.
- Handles multiple orders without assigning the same driver twice.
- Does not increment simulation time.

**`advanceDeliveries(state, driverSpeed)`**
- Processes orders in `assigned` or `picked_up` status.
- Finds the assigned driver using `driverId`.
- Moves the driver towards the pickup when the order is `assigned`.
- Moves the driver towards the dropoff when the order is `picked_up`.
- Changes the order to `picked_up` when the driver reaches the pickup.
- Changes the order to `delivered` when the driver reaches the dropoff.
- Makes the driver `idle` after delivery.
- Leaves orders unchanged if their assigned driver cannot be found.
- Does not increment simulation time.

**`tick(state, driverSpeed = 1)`**

Combines the simulation phases in this order:

1. Assign waiting orders.
2. Move drivers and update delivery statuses.
3. Increment simulation time once.

### Important Tick Behaviour

- A driver assigned during a tick can move towards the pickup in that same tick.
- A driver reaching the pickup becomes `picked_up`; it does not start travelling towards the dropoff until the next tick.
- A driver completing delivery becomes idle during the movement phase.
- That driver can only receive another order in the following tick because assignment happens before movement.

## 6. Engineering Decisions and Concepts Learned

- The simulation engine uses TypeScript and is kept separate from the frontend.
- Functions return updated state rather than mutating the original state.
- Tests cover expected behaviour and edge cases.
- Relative imports use `.js` extensions because the project uses NodeNext module resolution.
- Type-only imports use `import type`.
- `for...of` is used where sequential processing is important.
- Optional properties are omitted when undefined. For example:

```typescript
...(driverId !== undefined ? { driverId } : {})
```

- The first eligible driver wins when distances are equal.
- Driver assignment currently uses a greedy nearest-driver strategy.
- Movement currently uses straight-line distance on a simple 2D coordinate grid.

## 7. Current Progress

| Task | Status |
|---|---|
| Project setup and TypeScript configuration | Complete |
| Geometry and distance calculation | Complete |
| Core types | Complete |
| Nearest eligible driver assignment | Complete |
| Simulation state and initial tick logic | Complete |
| `moveToward()` and geometry tests | Complete |
| Delivery lifecycle and movement integration | Complete |

**Task 7 is complete.** The simulation can now handle the full order journey from assignment through pickup and delivery, including driver reuse.

The test suite and TypeScript typecheck have been run successfully.

## 8. Roadmap

The broader project direction is:

1. Finish the core simulation engine.
2. Build a visual 2D simulation showing drivers, orders, pickups, dropoffs, and movement.
3. Add useful simulation metrics:
   - Average delivery time
   - Average pickup waiting time
   - Driver utilization
   - Unassigned orders
   - Total distance travelled
   - Driver workload distribution
4. Compare the current greedy assignment strategy with a more advanced matching strategy.
5. Test different scenarios, including peak demand and limited driver availability.
6. Add backend APIs and persistence.
7. Explore meaningful extensions such as demand-aware driver repositioning or dynamic batching when the core system is ready.

Follow the next task instructions before adding new functionality. Do not jump ahead.

## 9. Current Limitations

- Uses a simple 2D coordinate grid, not real geographic roads.
- Movement is straight-line rather than road-network-based.
- Driver speed is fixed unless supplied to `tick`.
- Assignment is greedy and does not guarantee globally optimal matching.
- Does not currently model real traffic, GPS accuracy, or real-world ETA predictions.

These are intentional simplifications for the current stage.

## 10. Development Principles

- Understand the problem before implementing a solution.
- Keep the implementation aligned with the current task.
- Avoid unnecessary abstractions and complexity.
- Write tests for normal cases, edge cases, and state transitions.
- Preserve immutability.
- Understand every function rather than blindly copying code.
- Prefer measurable improvements over adding technologies for appearance.
- Keep the simulation engine independent of the UI.

**Immediate next step:** Continue with the next task in the agreed Claude-guided roadmap, without expanding the scope prematurely.