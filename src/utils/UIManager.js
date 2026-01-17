/**
 * UIManager
 * Manages all UI panels and entity selection
 */
export class UIManager {
  constructor(scene, simulation) {
    this.scene = scene;
    this.simulation = simulation;
    this.selectedEntity = null;

    // UI Elements
    this.globalStatsText = null;
    this.detailPanelText = null;
  }

  /**
   * Create all UI elements
   */
  createUI() {
    // Global stats panel (top-left)
    this.globalStatsText = this.scene.add.text(20, 20, '', {
      font: 'bold 14px Arial',
      fill: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 8 },
    });
    this.globalStatsText.setDepth(1000);
    this.scene.cameras.main.ignore(this.globalStatsText);

    // Entity detail panel (top-left, below global stats)
    this.detailPanelText = this.scene.add.text(20, 100, '', {
      font: '13px Arial',
      fill: '#ffffff',
      backgroundColor: '#001a33',
      padding: { x: 10, y: 8 },
    });
    this.detailPanelText.setDepth(1001);
    this.detailPanelText.setVisible(false);
    this.scene.cameras.main.ignore(this.detailPanelText);
  }

  /**
   * Update all UI panels
   */
  update() {
    this.updateGlobalStats();
    this.updateDetailPanel();
  }

  /**
   * Update global stats panel
   */
  updateGlobalStats() {
    const state = this.simulation.getState();
    const bases = this.simulation.getEntityManager().getEntitiesByType('base');
    const totalResources = bases.reduce((sum, base) => sum + base.resources, 0);

    this.globalStatsText.setText(
      `⚙ Ships: ${state.ships}  ⬩ Asteroids: ${state.asteroids}  ◈ Resources: ${Math.floor(totalResources)}`
    );
  }

  /**
   * Update entity detail panel
   */
  updateDetailPanel() {
    if (!this.selectedEntity) {
      this.detailPanelText.setVisible(false);
      return;
    }

    // Check if entity still exists
    const entity = this.simulation.getEntityManager().getEntity(this.selectedEntity.id);
    if (!entity) {
      this.selectedEntity = null;
      this.detailPanelText.setVisible(false);
      return;
    }

    this.detailPanelText.setVisible(true);

    // Update panel content based on entity type
    switch (entity.type) {
      case 'base':
        this.updateBaseDetail(entity);
        break;
      case 'ship':
        this.updateShipDetail(entity);
        break;
      case 'asteroid':
        this.updateAsteroidDetail(entity);
        break;
    }
  }

  /**
   * Update base detail panel
   */
  updateBaseDetail(base) {
    const constructionProgress = base.constructionTimer > 0
      ? Math.round((base.constructionTimer / this.simulation.config.shipConstructionTime) * 100)
      : 0;

    const constructionBar = this.createProgressBar(constructionProgress, 20);

    let text = `═══ BASE #${base.id} ═══\n`;
    text += `Position: (${Math.floor(base.x)}, ${Math.floor(base.y)})\n`;
    text += `Resources: ${Math.floor(base.resources)} ore\n`;
    text += `\n`;
    text += `Ship Construction:\n`;

    if (constructionProgress > 0) {
      text += `${constructionBar} ${constructionProgress}%\n`;
      text += `Cost: 200 ore | Time: 5.0s`;
    } else if (base.resources >= this.simulation.config.shipConstructionCost) {
      text += `Ready to build\n`;
      text += `Cost: 200 ore | Time: 5.0s`;
    } else {
      text += `Insufficient resources\n`;
      text += `Need: ${this.simulation.config.shipConstructionCost - Math.floor(base.resources)} more ore`;
    }

    this.detailPanelText.setText(text);
  }

  /**
   * Update ship detail panel
   */
  updateShipDetail(ship) {
    const target = ship.targetId
      ? this.simulation.getEntityManager().getEntity(ship.targetId)
      : null;

    const stateColors = {
      IDLE: '🟡',
      MOVING_TO_RESOURCE: '🟢',
      MINING: '🟠',
      RETURN_TO_BASE: '🔴',
    };

    let text = `═══ SHIP #${ship.id} ═══\n`;
    text += `Position: (${Math.floor(ship.x)}, ${Math.floor(ship.y)})\n`;
    text += `State: ${stateColors[ship.state] || '⚪'} ${ship.state}\n`;
    text += `Cargo: ${ship.cargo}/${this.simulation.config.maxCargo} ore\n`;

    if (ship.state === 'MINING' && ship.miningTimer !== undefined) {
      const miningProgress = Math.round((ship.miningTimer / this.simulation.config.miningDuration) * 100);
      const progressBar = this.createProgressBar(miningProgress, 20);
      text += `\nMining Progress:\n${progressBar} ${miningProgress}%`;
    }

    if (target) {
      text += `\n\nTarget: ${target.type.toUpperCase()} #${target.id}`;
      if (target.type === 'asteroid') {
        text += `\nTarget Resources: ${Math.floor(target.resourceAmount)} ore`;
      }
    }

    this.detailPanelText.setText(text);
  }

  /**
   * Update asteroid detail panel
   */
  updateAsteroidDetail(asteroid) {
    const ships = this.simulation.getEntityManager().getEntitiesByType('ship');
    const shipsTargeting = ships.filter(s => s.targetId === asteroid.id);
    const shipsMining = shipsTargeting.filter(s => s.state === 'MINING');

    const resourcePercent = Math.round((asteroid.resourceAmount / 500) * 100);
    const resourceBar = this.createProgressBar(resourcePercent, 20);

    let text = `═══ ASTEROID #${asteroid.id} ═══\n`;
    text += `Position: (${Math.floor(asteroid.x)}, ${Math.floor(asteroid.y)})\n`;
    text += `\n`;
    text += `Resources Remaining:\n`;
    text += `${resourceBar} ${resourcePercent}%\n`;
    text += `${Math.floor(asteroid.resourceAmount)}/500 ore\n`;
    text += `\n`;
    text += `Ships targeting: ${shipsTargeting.length}\n`;
    text += `Ships mining: ${shipsMining.length}`;

    this.detailPanelText.setText(text);
  }

  /**
   * Create a text-based progress bar
   */
  createProgressBar(percent, width) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Select an entity for detailed view
   */
  selectEntity(entity) {
    this.selectedEntity = entity;
  }

  /**
   * Deselect current entity
   */
  deselectEntity() {
    this.selectedEntity = null;
    this.detailPanelText.setVisible(false);
  }
}
