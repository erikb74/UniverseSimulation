/**
 * EntityRenderer
 * Converts entity data into Phaser visual representations.
 * Consumes data from EntityManager and renders shapes.
 */
export class EntityRenderer {
  /**
   * Initialize the renderer (should be called once in scene.create())
   * @param {Phaser.Scene} scene - Phaser scene
   * @returns {Phaser.GameObjects.Graphics} Graphics layer for rendering
   */
  static initializeGraphics(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: true });
    graphics.name = 'entitiesLayer';
    graphics.setScrollFactor(1, 1); // Scrolls with camera
    graphics.setDepth(10); // Render above grid
    return graphics;
  }

  /**
   * Render all entities from the entity manager
   * @param {Phaser.GameObjects.Graphics} graphics - Graphics layer
   * @param {EntityManager} entityManager - Entity manager with data
   */
  static renderEntities(graphics, entityManager) {
    // Clear the graphics layer
    graphics.clear();

    const entities = entityManager.getAllEntities();

    // First pass: draw asteroids and bases
    entities.forEach((entity) => {
      if (entity.type === 'base') {
        EntityRenderer.drawBase(graphics, entity);
      } else if (entity.type === 'asteroid') {
        EntityRenderer.drawAsteroid(graphics, entity);
      }
    });

    // Second pass: draw laser beams for mining ships
    entities.forEach((entity) => {
      if (entity.type === 'ship' && entity.state === 'MINING') {
        EntityRenderer.drawLaserBeam(graphics, entity, entityManager);
      }
    });

    // Third pass: draw ships on top
    entities.forEach((entity) => {
      if (entity.type === 'ship') {
        EntityRenderer.drawShip(graphics, entity);
      }
    });
  }

  /**
   * Draw a base (blue square)
   * @param {Phaser.GameObjects.Graphics} graphics - Graphics context
   * @param {Object} entity - Base entity
   */
  static drawBase(graphics, entity) {
    graphics.fillStyle(0x0099ff, 1);
    graphics.fillRect(entity.x - 20, entity.y - 20, 40, 40);
    graphics.lineStyle(2, 0x0066cc, 1);
    graphics.strokeRect(entity.x - 20, entity.y - 20, 40, 40);
  }

  /**
   * Draw an asteroid (gray circle)
   * @param {Phaser.GameObjects.Graphics} graphics - Graphics context
   * @param {Object} entity - Asteroid entity
   */
  static drawAsteroid(graphics, entity) {
    graphics.fillStyle(0x888888, 1);
    graphics.fillCircle(entity.x, entity.y, 15);
    graphics.lineStyle(1, 0x666666, 1);
    graphics.strokeCircle(entity.x, entity.y, 15);
  }

  /**
   * Draw a ship (colored circle based on state)
   * @param {Phaser.GameObjects.Graphics} graphics - Graphics context
   * @param {Object} entity - Ship entity
   */
  static drawShip(graphics, entity) {
    const stateColor = {
      IDLE: 0xffff00, // Yellow
      MOVING_TO_RESOURCE: 0xccff00, // Light yellow
      MINING: 0xff9900, // Orange
      RETURN_TO_BASE: 0xff3300, // Red
      REFUELING: 0x00ff00, // Green
    };

    const color = stateColor[entity.state] || 0xffff00;
    graphics.fillStyle(color, 1);
    graphics.fillCircle(entity.x, entity.y, 8);
    graphics.lineStyle(1, 0xcccc00, 1);
    graphics.strokeCircle(entity.x, entity.y, 8);
  }

  /**
   * Draw a laser beam from mining ship to asteroid
   * @param {Phaser.GameObjects.Graphics} graphics - Graphics context
   * @param {Object} shipEntity - Ship entity
   * @param {EntityManager} entityManager - Entity manager to get target asteroid
   */
  static drawLaserBeam(graphics, shipEntity, entityManager) {
    const target = entityManager.getEntity(shipEntity.targetId);
    if (!target || target.type !== 'asteroid') {
      return;
    }

    // Draw laser beam from ship to asteroid
    graphics.lineStyle(2, 0xff00ff, 0.8); // Magenta laser
    graphics.lineBetween(shipEntity.x, shipEntity.y, target.x, target.y);

    // Add glow effect with thinner lines
    graphics.lineStyle(1, 0xff66ff, 0.4); // Lighter magenta glow
    graphics.lineBetween(shipEntity.x, shipEntity.y, target.x, target.y);
  }
}
