class End extends Phaser.Scene {
    constructor() {
        super("endScene");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("Background2", "background2.png");  // Example asset


    }

    create() {
        // Add background image
        this.add.image(config.width / 2, config.height / 2, 'Background2').setOrigin(0.5).setScale(1);

        // Draw a semi-transparent rectangle over the background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.2); // Black color with 20% opacity
        graphics.fillRect(0, 0, config.width, config.height);

        // Add game title
        this.add.text(config.width / 2, config.height / 4, "Thanks for Playing", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add game title
        this.add.text(10, 10, "To be continued...", {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff'
        }).setOrigin(0);

        // Add credits
        const credits = [
            { role: 'Art', name: 'Kenney Asset packs' },
            { role: 'Sound/Audio', name: 'Square Enix: FFXIV' },
            { role: 'Design', name: 'Ethan Lin' },
            { role: 'Programming', name: 'Ethan Lin' },
            { role: 'Special Thanks', name: 'Prof. Whitehead' }
        ];

        let startY = config.height / 2.5;
        let creditTextHeight = 40;

        // Display credits text
        credits.forEach((credit, index) => {
            this.add.text(config.width / 2, startY + index * creditTextHeight, `${credit.role}: ${credit.name}`, {
                fontFamily: 'Arial',
                fontSize: 32,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Set background color with 50% opacity
                color: '#ffffff',
                padding: { x: 5, y: 3 },
            }).setOrigin(0.5);
        });

        // Add "press space to restart" text
        this.add.text(config.width * 0.51, config.height * 0.9, "Press SPACE to return to the Title Screen", {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create a key object for the spacebar
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.sound.play("theEnd", {
            volume: 0.05   // Can adjust volume using this, goes from 0 to 1
        });
    }

    update() {
        // Start the main game scene when spacebar is pressed
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start('titleScene');
        }
    }
}
