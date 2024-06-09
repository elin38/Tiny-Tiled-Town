class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load townsfolk
        this.load.image("character", "adventurer.png");
        this.load.image("villager1", "purple_villager.png");
        this.load.image("villager2", "blue_villager.png");
        this.load.image("villager3", "gray_villager.png");
        this.load.image("villager4", "brown_villager.png");
        this.load.image("questVillager", "green_villager.png");
        this.load.image("apothecary", "apothocary.png");
        this.load.image("honeyComb", "honey.png");
        this.load.image("retired", "retired_adventurer.png");

        //sound
        this.load.audio("dia", "dialogue.mp3");
        this.load.audio("diaC", "dialogueClose.mp3");
        this.load.audio("theEnd", "endGame.mp3");
        

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");                   // Packed tilemap
        this.load.tilemapTiledJSON("three-farmhouses", "three-farmhouses.tmj");   // Tilemap in JSON
    }

    create() {
         // ...and pass to the next Scene
         this.scene.start("titleScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}