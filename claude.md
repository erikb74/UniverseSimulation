# Universe Simulation - Project Governance

## Project Goals

- **Mobile-first Design**: Game should be responsive and playable on mobile and desktop devices.
- **A-Life Simulation**: Implement autonomous entities that make decisions based on environmental conditions and internal state (inspired by STALKER's A-Life system).
- **Separation of Logic and Rendering**: Strictly separate data models and simulation logic from Phaser scene rendering.
- **Emergent Gameplay**: Create systems where complex behaviors emerge from simple entity interactions and rules.
- **Scalability**: Support many autonomous entities (ships, bases, asteroids) without performance degradation.

## Tech Stack

- **Frontend**: Phaser 3 (game framework)
- **Build Tool**: Vite (fast bundler and dev server)
- **Runtime**: Node.js (for development and build)
- **Language**: JavaScript (ES6+)
- **Architecture**: Entity-Component-System (ECS) inspired separation

## Current Architecture

### Core Principles

1. **Data/Logic Separation**: All game logic, entity state, and simulation systems exist independently of Phaser.
2. **Phaser as Rendering Layer**: Phaser scenes only consume data from the simulation and render visual representations.
3. **Systems-Based Approach**: Game behavior is implemented through discrete systems that update entity state each frame.
4. **Single Source of Truth**: Each entity has a single data representation; Phaser only displays it.

### Directory Structure

```
src/
├── main.js                 # Entry point, game initialization
├── scenes/                 # Phaser scene definitions
│   └── GameScene.js       # Main game rendering scene
├── entities/              # Entity data models
│   ├── Base.js            # Base entity definition
│   ├── Ship.js            # Ship entity definition
│   └── Asteroid.js        # Asteroid entity definition
├── systems/               # Simulation logic systems
│   ├── MiningSystem.js    # Handles mining ship behavior
│   ├── MovementSystem.js  # Handles entity movement
│   └── AISystem.js        # Handles autonomous decision-making
└── utils/                 # Helper functions and utilities
    └── index.js           # Common utilities
```

## Entity Definitions

### Base
- **Purpose**: Static structure that serves as a resource processing and storage hub.
- **Properties**:
  - `id`: Unique identifier
  - `position`: { x, y } coordinates
  - `health`: Current hull integrity (0-100)
  - `energy`: Energy reserves for operations
  - `storage`: { ore: amount, water: amount, ... }
  - `type`: "base"
- **Behaviors**:
  - Receives resources from mining ships
  - Generates energy (passive)
  - Can repair nearby ships

### Ship (Miner)
- **Purpose**: Autonomous entity that seeks asteroids, mines them, and returns to base.
- **Properties**:
  - `id`: Unique identifier
  - `position`: { x, y } coordinates
  - `velocity`: { vx, vy } direction and speed
  - `health`: Current hull integrity (0-100)
  - `energy`: Current fuel/energy reserves
  - `cargo`: Current load capacity and contents
  - `state`: "idle" | "mining" | "returning" | "refueling"
  - `targetId`: ID of current target (asteroid or base)
  - `type`: "ship"
- **Behaviors**:
  - Autonomously searches for asteroids
  - Approaches and mines asteroids
  - Returns to base when cargo is full or energy is low
  - Avoids collisions with other entities
  - Makes decisions based on environmental conditions

### Asteroid
- **Purpose**: Static resource nodes that can be mined by ships.
- **Properties**:
  - `id`: Unique identifier
  - `position`: { x, y } coordinates
  - `radius`: Size of asteroid
  - `ore`: Available ore to extract
  - `type`: "asteroid"
- **Behaviors**:
  - Depletes as ships mine it
  - Destroyed when ore reaches 0
  - Provides no active behavior (passive resource)

## Change Log

### [2026-01-17]
- **Initial Setup**
  - Initialized Vite project with Phaser 3
  - Created project directory structure
  - Set up package.json with dev/build scripts
  - Created vite.config.js for development configuration
  - Created index.html as entry point
  - Created src/main.js with basic Phaser game configuration
  - Established project governance and architecture documentation in claude.md

---

## Development Notes

- When making changes, update this file's Change Log section.
- Refer to the Entity Definitions when creating new entity types.
- Keep the separation between data (entities/) and rendering (scenes/) strict.
- Systems should operate on entity data without knowledge of Phaser.
