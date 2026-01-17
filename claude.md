# Universe Simulation - System Card

## Core Philosophy

- **Mobile-First**: Responsive gameplay on mobile and desktop
- **Logic/Render Separation**: Game logic in Simulation layer; Phaser handles only rendering
- **Autonomous A-Life**: Ships make decisions via FSM based on environmental state
- **Emergent Complexity**: Simple rules generate complex behaviors
- **Scalability**: Support many entities without performance degradation

## Tech Stack

Phaser 3 | Vite | Node.js | JavaScript ES6+ | ECS-inspired architecture

## Architecture Overview

**Core Loop**: `MainScene.update()` → `Simulation.tick(delta)` → `EntityRenderer.render()` each frame

**Key Files**:

- [src/systems/Simulation.js](src/systems/Simulation.js) — AI FSM, resource logic, world generation
- [src/systems/EntityManager.js](src/systems/EntityManager.js) — Entity CRUD operations
- [src/utils/EntityRenderer.js](src/utils/EntityRenderer.js) — Phaser rendering bridge
- [src/scenes/MainScene.js](src/scenes/MainScene.js) — Camera, input, world bounds (4000×4000)

## Ship AI - Finite State Machine

Ships cycle through four states with deterministic exit conditions:

| State | Behavior | Exit Condition |
| --- | --- | --- |
| **IDLE** | Scan for asteroids within 800-unit detection radius | Asteroid found → MOVING_TO_RESOURCE |
| **MOVING_TO_RESOURCE** | Move toward asteroid at 100 u/s; stop at 55-unit orbit | Arrived (dist ≤ 55u) → MINING; target lost → IDLE |
| **MINING** | Orbit at 50u radius, extract 5 ore/500ms | Timer ≥ 10s OR cargo ≥ 100 OR asteroid ≤ 0 → RETURN_TO_BASE; target lost → IDLE |
| **RETURN_TO_BASE** | Move toward base; unload cargo on arrival | Arrived (dist ≤ 10u) → IDLE; no base → IDLE |

**Base Construction**: Consumes 200 ore → 5-second build → spawns new ship at base location

## Entity Data Structures

**Base**: `{ id, x, y, type: 'base', resources, constructionTimer }`

- Rendering: Blue 40×40 square
- Role: Resource accumulator; constructs ships

**Asteroid**: `{ id, x, y, type: 'asteroid', resourceAmount: 500 }`

- Rendering: Gray circle (r=15)
- Depletes via mining; auto-removed when resourceAmount ≤ 0

**Ship**: `{ id, x, y, type: 'ship', cargo, state, targetId, miningTimer, orbitAngle, lastMineTime }`

- Rendering: Color-coded 8-pixel circle (IDLE=yellow, MOVING=light yellow, MINING=orange+laser, RETURN=red)

## World Generation

Random asteroid placement via [Simulation.generateRandomAsteroids()](src/systems/Simulation.js):

1. Generate random (x, y) within 4000×4000 bounds
2. **Safe Zone**: Reject if within 300u of base center
3. **Overlap Check**: Reject if within 30u of existing asteroid
4. Max 100 attempts per asteroid; continue on failure

Default: 15 asteroids at init; configurable via parameter.

## Input & Camera

- **Drag-to-Pan**: Single-finger drag (clamped to world bounds)
- **Pinch-to-Zoom**: Two-finger pinch (0.5× to 3×)
- **Mouse Wheel**: Desktop zoom support

See [MainScene.js:input handling](src/scenes/MainScene.js) for implementation

## Current Focus

**Last Completed**:

1. Smart ship AI load balancing (distributes ships across asteroids)
2. Interactive UI system with entity selection and detail panels

**Next**:

- Collision avoidance between ships
- Advanced mining logic (resource types, dynamic spawning)
- Player interaction (click to select, build structures)

## Development Guidelines

- Keep logic in `src/systems/` independent of Phaser
- Update this file when adding major features
- Entity properties and FSM states are single source of truth
