class Title extends Phaser.Scene {
    constructor() {
        super("titleScene");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("Background", "background.png");  // Example asset
    }

    create() {
        // Add background image
        this.add.image(config.width / 2, config.height / 2, 'Background').setOrigin(0.5).setScale(1);

        // Draw a semi-transparent rectangle over the background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.2); // Black color with 50% opacity
        graphics.fillRect(0, 0, config.width, config.height);

        // Add game title
        this.add.text(config.width / 2, config.height / 3, "Tiny Tiled Town", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add author name
        this.add.text(config.width * 0.52, config.height * 0.45, "by Ethan Lin", {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add "press space to start" text
        this.add.text(config.width * 0.51, config.height * 0.9, "Press SPACE to Start", {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create a key object for the spacebar
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        // Start the main game scene when spacebar is pressed
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start('gameScene');
            // this.scene.start('endScene');
        }
    }
}