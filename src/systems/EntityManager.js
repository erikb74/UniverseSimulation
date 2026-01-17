/**
 * EntityManager
 * Pure data management layer. Holds all entities and provides CRUD operations.
 * Independent of Phaser - just JavaScript data structures.
 */
export class EntityManager {
  constructor() {
    this.entities = new Map(); // id -> entity
    this.nextId = 1;
    this.entitiesByType = {
      base: [],
      asteroid: [],
      ship: [],
    };
  }

  /**
   * Create a new Base entity
   * @param {number} x - World position X
   * @param {number} y - World position Y
   * @returns {Object} Base entity
   */
  createBase(x, y) {
    const entity = {
      id: this.nextId++,
      x,
      y,
      type: 'base',
      resources: 0,
      constructionTimer: 0, // Time accumulated toward next ship construction
    };
    this.addEntity(entity);
    return entity;
  }

  /**
   * Create a new Asteroid entity
   * @param {number} x - World position X
   * @param {number} y - World position Y
   * @returns {Object} Asteroid entity
   */
  createAsteroid(x, y) {
    const entity = {
      id: this.nextId++,
      x,
      y,
      type: 'asteroid',
      resourceAmount: 500,
    };
    this.addEntity(entity);
    return entity;
  }

  /**
   * Create a new Ship entity
   * @param {number} x - World position X
   * @param {number} y - World position Y
   * @returns {Object} Ship entity
   */
  createShip(x, y) {
    const entity = {
      id: this.nextId++,
      x,
      y,
      type: 'ship',
      cargo: 0,
      state: 'IDLE', // IDLE, MINING, RETURNING, REFUELING
    };
    this.addEntity(entity);
    return entity;
  }

  /**
   * Add an entity to the manager
   * @param {Object} entity - Entity object
   */
  addEntity(entity) {
    this.entities.set(entity.id, entity);
    this.entitiesByType[entity.type].push(entity);
  }

  /**
   * Get an entity by ID
   * @param {number} id - Entity ID
   * @returns {Object|undefined} Entity object
   */
  getEntity(id) {
    return this.entities.get(id);
  }

  /**
   * Get all entities of a specific type
   * @param {string} type - Entity type: 'base', 'asteroid', 'ship'
   * @returns {Array} Array of entities
   */
  getEntitiesByType(type) {
    return this.entitiesByType[type] || [];
  }

  /**
   * Get all entities
   * @returns {Array} All entities
   */
  getAllEntities() {
    return Array.from(this.entities.values());
  }

  /**
   * Remove an entity by ID
   * @param {number} id - Entity ID
   */
  removeEntity(id) {
    const entity = this.entities.get(id);
    if (entity) {
      this.entities.delete(id);
      const typeArray = this.entitiesByType[entity.type];
      const index = typeArray.indexOf(entity);
      if (index > -1) {
        typeArray.splice(index, 1);
      }
    }
  }

  /**
   * Update an entity's position
   * @param {number} id - Entity ID
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  updatePosition(id, x, y) {
    const entity = this.getEntity(id);
    if (entity) {
      entity.x = x;
      entity.y = y;
    }
  }

  /**
   * Clear all entities
   */
  clear() {
    this.entities.clear();
    this.entitiesByType.base = [];
    this.entitiesByType.asteroid = [];
    this.entitiesByType.ship = [];
    this.nextId = 1;
  }
}
