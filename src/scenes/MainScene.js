import Phaser from 'phaser';
import { Simulation } from '../systems/Simulation.js';
import { EntityRenderer } from '../utils/EntityRenderer.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.worldWidth = 4000;
    this.worldHeight = 4000;
    this.gridSize = 100;
    this.simulation = null;
    this.entityGraphics = null;
    this.uiText = null;
  }

  create() {
    // Set world physics bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Create debug grid
    this.createDebugGrid();

    // Initialize simulation (pure logic, no Phaser)
    this.simulation = new Simulation();
    this.simulation.initialize();

    // Initialize entity renderer graphics layer
    this.entityGraphics = EntityRenderer.initializeGraphics(this);

    // Render initial entities
    EntityRenderer.renderEntities(this.entityGraphics, this.simulation.getEntityManager());

    // Create camera
    this.setupCamera();

    // Input handling
    this.setupInputHandling();

    // Create UI overlay
    this.createUIOverlay();

    // Log initial state
    console.log('MainScene created with world bounds:', this.worldWidth, 'x', this.worldHeight);
    console.log('Simulation state:', this.simulation.getState());
  }

  createUIOverlay() {
    // Create UI camera (fixed to screen, independent from world camera)
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCamera.ignore(this.entityGraphics);

    // Create fixed UI text on UI layer
    this.uiText = this.add.text(20, 20, '', {
      font: '16px Arial',
      fill: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 },
    });
    this.uiText.setScrollFactor(0, 0); // Fixed to screen
    this.uiText.setDepth(1000); // Render on top of everything
    this.cameras.main.ignore(this.uiText); // Main camera ignores UI text
  }

  createDebugGrid() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.setScrollFactor(1, 1); // Grid scrolls with camera
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Draw grid lines
    graphics.lineStyle(1, 0x444444, 0.5);
    for (let x = 0; x <= this.worldWidth; x += this.gridSize) {
      graphics.lineBetween(x, 0, x, this.worldHeight);
    }
    for (let y = 0; y <= this.worldHeight; y += this.gridSize) {
      graphics.lineBetween(0, y, this.worldWidth, y);
    }

    // Draw thicker lines every 500 units
    graphics.lineStyle(2, 0x666666, 0.7);
    for (let x = 0; x <= this.worldWidth; x += 500) {
      graphics.lineBetween(x, 0, x, this.worldHeight);
    }
    for (let y = 0; y <= this.worldHeight; y += 500) {
      graphics.lineBetween(0, y, this.worldWidth, y);
    }

    graphics.generateTexture('gridTexture', this.worldWidth, this.worldHeight);
    graphics.destroy();

    // Create tiled sprite from generated texture
    this.add.image(this.worldWidth / 2, this.worldHeight / 2, 'gridTexture').setScrollFactor(1, 1);
  }

  setupCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.worldWidth, this.worldHeight);
    camera.centerOn(this.worldWidth / 2, this.worldHeight / 2);

    // Store camera state for input handling
    this.cameraState = {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragStartCameraX: 0,
      dragStartCameraY: 0,
      initialDistance: 0,
      minZoom: 0.5,
      maxZoom: 3,
    };
  }

  setupInputHandling() {
    const input = this.input;

    // Pointer down event (touch or mouse)
    input.on('pointerdown', (pointer) => {
      this.cameraState.isDragging = true;
      this.cameraState.dragStartX = pointer.x;
      this.cameraState.dragStartY = pointer.y;
      this.cameraState.dragStartCameraX = this.cameras.main.scrollX;
      this.cameraState.dragStartCameraY = this.cameras.main.scrollY;

      // Store initial distance for pinch detection
      if (input.pointer1.isDown && input.pointer2) {
        this.cameraState.initialDistance = Phaser.Math.Distance.Between(
          input.pointer1.x,
          input.pointer1.y,
          input.pointer2.x,
          input.pointer2.y
        );
      }
    });

    // Pointer move event (drag panning)
    input.on('pointermove', (pointer) => {
      if (this.cameraState.isDragging) {
        // Check for pinch zoom (two fingers)
        if (input.pointer1.isDown && input.pointer2) {
          this.handlePinchZoom();
        } else {
          // Single finger drag pan
          this.handleDragPan(pointer);
        }
      }
    });

    // Pointer up event
    input.on('pointerup', () => {
      this.cameraState.isDragging = false;
    });

    // Mouse wheel zoom
    input.mouse.disableContextMenu();
    input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
      const camera = this.cameras.main;
      const zoomChange = deltaY > 0 ? 0.1 : -0.1;
      const newZoom = Phaser.Math.Clamp(
        camera.zoom + zoomChange,
        this.cameraState.minZoom,
        this.cameraState.maxZoom
      );
      camera.setZoom(newZoom);
    });
  }

  handleDragPan(pointer) {
    const deltaX = pointer.x - this.cameraState.dragStartX;
    const deltaY = pointer.y - this.cameraState.dragStartY;
    const camera = this.cameras.main;

    // Pan is inverted (dragging right moves camera left)
    const newX = Phaser.Math.Clamp(
      this.cameraState.dragStartCameraX - deltaX / camera.zoom,
      0,
      this.worldWidth - camera.width / camera.zoom
    );
    const newY = Phaser.Math.Clamp(
      this.cameraState.dragStartCameraY - deltaY / camera.zoom,
      0,
      this.worldHeight - camera.height / camera.zoom
    );

    camera.setScroll(newX, newY);
  }

  handlePinchZoom() {
    const input = this.input;
    const camera = this.cameras.main;

    const currentDistance = Phaser.Math.Distance.Between(
      input.pointer1.x,
      input.pointer1.y,
      input.pointer2.x,
      input.pointer2.y
    );

    const distanceDelta = currentDistance - this.cameraState.initialDistance;
    const zoomChange = distanceDelta * 0.01; // Sensitivity factor

    const newZoom = Phaser.Math.Clamp(
      camera.zoom + zoomChange,
      this.cameraState.minZoom,
      this.cameraState.maxZoom
    );

    camera.setZoom(newZoom);
    this.cameraState.initialDistance = currentDistance;
  }

  update(time, delta) {
    // Call simulation tick with delta time
    if (this.simulation) {
      this.simulation.tick(delta);

      // Re-render entities every frame
      EntityRenderer.renderEntities(this.entityGraphics, this.simulation.getEntityManager());

      // Update UI overlay
      this.updateUIOverlay();
    }
  }

  updateUIOverlay() {
    const state = this.simulation.getState();
    const bases = this.simulation.getEntityManager().getEntitiesByType('base');
    const baseResources = bases.length > 0 ? bases[0].resources : 0;
    const baseConstruction = bases.length > 0 ? bases[0].constructionTimer : 0;

    const constructionStatus = baseConstruction > 0
      ? `${Math.round((baseConstruction / this.simulation.config.shipConstructionTime) * 100)}%`
      : 'Idle';

    this.uiText.setText(
      `Resources: ${Math.floor(baseResources)}\n` +
      `Ships: ${state.ships}\n` +
      `Asteroids: ${state.asteroids}\n` +
      `Construction: ${constructionStatus}`
    );
  }
}
