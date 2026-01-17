import Phaser from 'phaser';

// Placeholder for main game initialization
// Game configuration and scene setup will be added here

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    // Scenes will be registered here
  ],
};

const game = new Phaser.Game(config);
