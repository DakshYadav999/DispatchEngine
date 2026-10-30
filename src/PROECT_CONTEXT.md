# DispatchLab: Project Context

## Vision
A dispatch simulator: drivers and delivery orders on a map, assignment
strategies compared with real measured metrics. Portfolio project for SDE-1.

## Stack (planned)
- Engine: TypeScript, Vitest (current)
- Frontend: React + Vite, canvas first, Leaflet later
- Backend: Node + Express, PostgreSQL + Prisma, Socket.IO (later)

## Current structure
dispatch-engine/
  src/geometry.ts      Point, distance
  src/types.ts         Driver, Order, status unions
  src/assignment.ts    findNearestDriver (pure function)

## Decisions
- Engine is pure TypeScript with no web or Node specifics, so it can be
  reused by frontend and backend.
- Strategies are pure functions that return a decision; the simulation applies it.
- Ties are broken by array order (first wins) to keep runs deterministic.
- ES modules; relative imports end in .js; `import type` for types.
- Frontend before backend; Redis/Kafka/H3 only if a real need appears.

## Status
Done: setup, distance, types, findNearestDriver (9 tests passing).

## Next
Task 5: simulation state and a tick loop.

## Known limitations
- Straight-line distance on a flat grid, no roads.
- Greedy strategy only.

## Out of scope for the MVP
Auth, ML-based ETAs, real GPS, microservices.