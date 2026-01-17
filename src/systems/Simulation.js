import { EntityManager } from './EntityManager.js';

/**
 * Simulation
 * The core "brain" of the game. Pure logic, no Phaser dependencies.
 * Manages game state and progression through discrete ticks.
 */
export class Simulation {
  constructor() {
    this.entityManager = new EntityManager();
    this.time = 0; // Accumulated time in milliseconds
    this.tickRate = 0.016; // Target ~60 FPS in seconds per tick

    // AI Configuration Constants
    this.config = {
      shipSpeed: 100, // units/second
      orbitRadius: 50, // distance from asteroid during mining
      orbitSpeed: Math.PI, // radians/second (completes orbit in ~2 seconds)
      miningDuration: 10000, // milliseconds (10 seconds)
      miningTickRate: 500, // milliseconds between resource extractions
      miningRate: 5, // ore extracted per tick
      maxCargo: 100, // maximum ore per ship
      detectionRadius: 800, // distance to scan for nearby asteroids
      // Base construction parameters
      shipConstructionCost: 200, // ore required per ship
      shipConstructionTime: 5000, // milliseconds to build a ship
    };
  }

  /**
   * Initialize the simulation with some test data
   */
  initialize() {
    // Create a base at center
    const base = this.entityManager.createBase(2000, 2000);

    // Generate asteroids with random distribution
    this.generateRandomAsteroids(base, 15);

    // Create some ships
    this.entityManager.createShip(2000, 2100);
    this.entityManager.createShip(2100, 2000);
    this.entityManager.createShip(1900, 2000);

    console.log('Simulation initialized');
    console.log(`Entities: ${this.entityManager.getAllEntities().length}`);
  }

  /**
   * Generate asteroids with random distribution
   * Applies safe zone constraint (no asteroids within 300px of base)
   * Prevents asteroid overlap (30px minimum distance)
   *
   * @param {Object} base - Base entity
   * @param {number} count - Number of asteroids to generate
   */
  generateRandomAsteroids(base, count) {
    const WORLD_BOUNDS = 4000;
    const SAFE_ZONE_RADIUS = 300; // No asteroids within this distance of base
    const ASTEROID_MIN_DISTANCE = 30; // Minimum distance between asteroids
    const MAX_ATTEMPTS = 100; // Prevent infinite loops

    const asteroids = [];
    let placed = 0;

    while (placed < count) {
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        // Random coordinates within world bounds
        const x = Math.random() * WORLD_BOUNDS;
        const y = Math.random() * WORLD_BOUNDS;

        // Check safe zone constraint
        const distToBase = Math.sqrt((x - base.x) ** 2 + (y - base.y) ** 2);
        if (distToBase < SAFE_ZONE_RADIUS) {
          attempts++;
          continue;
        }

        // Check for overlaps with existing asteroids
        let overlapsExisting = false;
        for (const asteroid of asteroids) {
          const dist = Math.sqrt((x - asteroid.x) ** 2 + (y - asteroid.y) ** 2);
          if (dist < ASTEROID_MIN_DISTANCE) {
            overlapsExisting = true;
            break;
          }
        }

        if (overlapsExisting) {
          attempts++;
          continue;
        }

        // Valid position found
        const newAsteroid = this.entityManager.createAsteroid(x, y);
        asteroids.push(newAsteroid);
        placed++;
        break;
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.warn(`Failed to place asteroid ${placed + 1}/${count} after ${MAX_ATTEMPTS} attempts`);
        break;
      }
    }

    console.log(`Generated ${placed} asteroids`);
  }

  /**
   * Main simulation loop
   * Called once per frame. Pure logic—no rendering happens here.
   * @param {number} delta - Milliseconds since last frame
   */
  tick(delta) {
    this.time += delta;

    // Update ship states and behaviors via FSM
    this.updateShips(delta);

    // Update base construction
    this.updateBases(delta);

    // Clean up depleted asteroids
    this.cleanupAsteroids();

    // Future systems can be called here:
    // this.handleCollisions();
  }

  /**
   * Update all ships using Finite State Machine
   * @param {number} delta - Delta time in milliseconds
   */
  updateShips(delta) {
    const ships = this.entityManager.getEntitiesByType('ship');

    ships.forEach((ship) => {
      // FSM state dispatch
      switch (ship.state) {
        case 'IDLE':
          this.handleIdleState(ship);
          break;
        case 'MOVING_TO_RESOURCE':
          this.handleMovingToResourceState(ship, delta);
          break;
        case 'MINING':
          this.handleMiningState(ship, delta);
          break;
        case 'RETURN_TO_BASE':
          this.handleReturnToBaseState(ship, delta);
          break;
        default:
          ship.state = 'IDLE'; // Fallback to IDLE
      }
    });
  }

  /**
   * IDLE STATE
   * Exit conditions:
   *   - Nearby asteroid found → transition to MOVING_TO_RESOURCE
   */
  handleIdleState(ship) {
    const asteroids = this.entityManager.getEntitiesByType('asteroid');

    if (asteroids.length > 0) {
      // Find nearest asteroid within detection radius
      let nearestAsteroid = null;
      let minDistance = this.config.detectionRadius;

      asteroids.forEach((asteroid) => {
        const dx = asteroid.x - ship.x;
        const dy = asteroid.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearestAsteroid = asteroid;
        }
      });

      if (nearestAsteroid) {
        ship.targetId = nearestAsteroid.id;
        ship.state = 'MOVING_TO_RESOURCE';
      }
    }
  }

  /**
   * MOVING_TO_RESOURCE STATE
   * Exit conditions:
   *   - Arrived at asteroid (within orbitRadius) → transition to MINING
   *   - Target asteroid no longer exists → transition to IDLE
   */
  handleMovingToResourceState(ship, delta) {
    const target = this.entityManager.getEntity(ship.targetId);

    if (!target || target.type !== 'asteroid') {
      // Target lost—return to IDLE
      ship.state = 'IDLE';
      return;
    }

    // Move toward asteroid
    const dx = target.x - ship.x;
    const dy = target.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.config.orbitRadius + 5) {
      // Still en route—continue moving
      const moveDistance = (this.config.shipSpeed * delta) / 1000;
      ship.x += (dx / distance) * moveDistance;
      ship.y += (dy / distance) * moveDistance;
    } else {
      // Arrived at asteroid—begin mining
      ship.state = 'MINING';
      ship.miningTimer = 0;
      ship.orbitAngle = 0;
      ship.lastMineTime = 0;
    }
  }

  /**
   * MINING STATE
   * Exit conditions:
   *   - Mining duration completed (10 seconds) → transition to RETURN_TO_BASE
   *   - Cargo full (100 ore) → transition to RETURN_TO_BASE
   *   - Asteroid depleted (≤0 ore) → transition to RETURN_TO_BASE
   *   - Target lost → transition to IDLE
   */
  handleMiningState(ship, delta) {
    const target = this.entityManager.getEntity(ship.targetId);

    if (!target || target.type !== 'asteroid') {
      // Target lost—return to IDLE
      ship.state = 'IDLE';
      return;
    }

    // Orbit the asteroid
    ship.orbitAngle += (this.config.orbitSpeed * delta) / 1000;
    ship.x = target.x + Math.cos(ship.orbitAngle) * this.config.orbitRadius;
    ship.y = target.y + Math.sin(ship.orbitAngle) * this.config.orbitRadius;

    // Accumulate mining time
    ship.miningTimer += delta;
    ship.lastMineTime += delta;

    // Extract resources at regular intervals
    if (ship.lastMineTime >= this.config.miningTickRate) {
      ship.cargo += this.config.miningRate;
      target.resourceAmount -= this.config.miningRate;
      ship.lastMineTime = 0;
    }

    // Check exit conditions
    const miningComplete = ship.miningTimer >= this.config.miningDuration;
    const cargoFull = ship.cargo >= this.config.maxCargo;
    const asteroidDepleted = target.resourceAmount <= 0;

    if (miningComplete || cargoFull || asteroidDepleted) {
      ship.state = 'RETURN_TO_BASE';
      ship.miningTimer = 0;
      ship.lastMineTime = 0;
    }
  }

  /**
   * RETURN_TO_BASE STATE
   * Exit conditions:
   *   - Arrived at base → transfer resources, transition to IDLE
   *   - Base no longer exists → transition to IDLE
   */
  handleReturnToBaseState(ship, delta) {
    const bases = this.entityManager.getEntitiesByType('base');

    if (bases.length === 0) {
      // No base available—return to IDLE
      ship.state = 'IDLE';
      return;
    }

    const base = bases[0]; // Use first base (single base for now)

    // Move toward base
    const dx = base.x - ship.x;
    const dy = base.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      // Still en route—continue moving
      const moveDistance = (this.config.shipSpeed * delta) / 1000;
      ship.x += (dx / distance) * moveDistance;
      ship.y += (dy / distance) * moveDistance;
    } else {
      // Arrived at base—transfer cargo and return to IDLE
      base.resources += ship.cargo;
      ship.cargo = 0;
      ship.state = 'IDLE';
    }
  }

  /**
   * Update all bases - handle ship construction
   * @param {number} delta - Delta time in milliseconds
   */
  updateBases(delta) {
    const bases = this.entityManager.getEntitiesByType('base');

    bases.forEach((base) => {
      // Check if construction is in progress
      if (base.constructionTimer > 0) {
        base.constructionTimer += delta;

        // Check if construction is complete
        if (base.constructionTimer >= this.config.shipConstructionTime) {
          // Spawn new ship at base location
          this.entityManager.createShip(base.x, base.y);
          base.constructionTimer = 0; // Reset timer for next construction
        }
      } else if (base.resources >= this.config.shipConstructionCost) {
        // Start construction if resources available
        base.resources -= this.config.shipConstructionCost;
        base.constructionTimer = 1; // Start timer (not 0 to avoid infinite loop)
      }
    });
  }

  /**
   * Clean up depleted asteroids
   */
  cleanupAsteroids() {
    const asteroids = this.entityManager.getEntitiesByType('asteroid');
    asteroids.forEach((asteroid) => {
      if (asteroid.resourceAmount <= 0) {
        this.entityManager.removeEntity(asteroid.id);
      }
    });
  }

  /**
   * Get the entity manager (for rendering)
   * @returns {EntityManager} The entity manager instance
   */
  getEntityManager() {
    return this.entityManager;
  }

  /**
   * Get simulation state for debugging/UI
   * @returns {Object} Simulation state
   */
  getState() {
    return {
      time: this.time,
      totalEntities: this.entityManager.getAllEntities().length,
      bases: this.entityManager.getEntitiesByType('base').length,
      ships: this.entityManager.getEntitiesByType('ship').length,
      asteroids: this.entityManager.getEntitiesByType('asteroid').length,
    };
  }
}
