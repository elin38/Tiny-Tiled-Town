class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");
    }

    preload() {
    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 3.0;
        this.TILEWIDTH = 50;
        this.TILEHEIGHT = 50;
        this.walkingSpeed = 200;
        this.villagerWalkingSpeed = 300;
        this.villagers = [];
        this.isMoving = false;
        this.dialogueShowing = false;

        //quest flags
        this.questRunAccepted = false;
        this.questHoneyAccepted = false;
        this.questCartAccepted = false;

        this.questRunCompleted = false;
        this.questCartCompleted = false;
        this.hasHoney = false;

        this.canRun = false;
    }

    create() {
        // Create a new tilemap which uses 16x16 tiles, and is 50 tiles wide and 50 tiles tall
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEWIDTH, this.TILEHEIGHT);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        // Create the layers
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);

        // Create townsfolk sprite
        // Use setOrigin() to ensure the tile space computations work well
        this.activeCharacter = this.add.sprite(this.tileXtoWorld(5), this.tileYtoWorld(5), "character").setOrigin(0, 0);

        this.villagers.push(this.createVillager(this.tileXtoWorld(14), this.tileYtoWorld(5), "villager1"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(23), this.tileYtoWorld(5), "villager2"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(5), this.tileYtoWorld(15), "villager1"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(14), this.tileYtoWorld(15), "villager2"));

        this.villagers.push(this.createVillager(this.tileXtoWorld(23), this.tileYtoWorld(15), "villager3"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(32), this.tileYtoWorld(5), "villager4"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(32), this.tileYtoWorld(15), "villager4"));

        //quest spawnlocations
        this.questRun = this.add.sprite(this.tileXtoWorld(19), this.tileYtoWorld(6), "questVillager").setOrigin(0, 0);
        this.apothecary = this.add.sprite(this.tileXtoWorld(7), this.tileYtoWorld(43), "apothecary").setOrigin(0, 0);
        this.honeyComb = this.add.sprite(this.tileXtoWorld(45), this.tileYtoWorld(38), "honeyComb").setOrigin(0, 0);
        this.retiredAdventurer = this.add.sprite(this.tileXtoWorld(20), this.tileYtoWorld(25), "retired").setOrigin(0, 0);

        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);
        this.cameras.main.startFollow(this.activeCharacter, true, 0.1, 0.1); // Follow the character

        // Create grid of visible tiles for use with path planning
        let tinyTownGrid = this.layersToGrid();

        let walkables = [1, 2, 3, 30, 40, 41, 42, 43, 44, 95, 13, 14, 15, 25, 26, 27, 37, 38, 39, 70, 84];

        // Initialize EasyStar pathfinder
        this.finder = new EasyStar.js();

        // Pass grid information to EasyStar
        this.finder.setGrid(tinyTownGrid);

        // Tell EasyStar which tiles can be walked on
        this.finder.setAcceptableTiles(walkables);

        // Handle mouse clicks
        this.input.on('pointerup', this.handleClick, this);

        this.cKey = this.input.keyboard.addKey('C');
        this.eKey = this.input.keyboard.addKey('E');
        this.running = true;
        this.setCost(this.tileset);

        // Start the villager movement timer
        this.startVillagerTimer();

        //text for playable character
        this.textInteract = this.add.text(this.activeCharacter.x, this.activeCharacter.y, "E", {
            fontFamily: 'Helvetica',
            fontSize: 10,
            wordWrap: {
                width: 250
            }
        });
        this.textInteract.setOrigin(0, 0); // Center the text horizontally
        // Hide the interact text initially
        this.textInteract.visible = false;

        //text for questIndication
        //text for playable character
        this.textRunQuestAvailable = this.add.text(this.questRun.x + 6.5, this.questRun.y - 14, "!", {
            fontFamily: 'Helvetica',
            color: '#FFFF00',
            fontSize: 12,
            wordWrap: {
                width: 250
            }
        });
        this.textRunQuestAvailable.setOrigin(0, 0); // Center the text horizontally
        this.textRunQuestAvailable.visible = false;

        //text for quest indication of apothecary
        //text for playable character
        this.textApothecaryQ = this.add.text(this.apothecary.x + 4, this.apothecary.y - 14, "?", {
            fontFamily: 'Helvetica',
            color: '#FFFF00',
            fontSize: 12,
            wordWrap: {
                width: 250
            }
        });
        this.textApothecaryQ.setOrigin(0, 0); // Center the text horizontally
        this.textApothecaryQ.visible = false;

        //text for quest indication of apothecary
        //text for playable character
        this.adventurerQ = this.add.text(this.retiredAdventurer.x + 6, this.retiredAdventurer.y - 14, "!", {
            fontFamily: 'Helvetica',
            color: '#FFFF00',
            fontSize: 12,
            wordWrap: {
                width: 250
            }
        });
        this.adventurerQ.setOrigin(0, 0); // Center the text horizontally
        this.adventurerQ.visible = true;

        //text
        this.dialogueBox = this.add.text(0, 0, "Text Box", {
            fontFamily: 'Helvetica',
            fontSize: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Set background color with 50% opacity
            color: '#ffffff',
            padding: { x: 5, y: 3 },
            wordWrap: { width: this.cameras.main.width / this.SCALE - 10}
        });
        this.dialogueBox.setOrigin(0.5, 0.5); // Center the text horizontally

        this.dialogueBox.setPosition(
            this.cameras.main.worldView.x + (this.cameras.main.width / this.SCALE) / 2,
            this.cameras.main.worldView.y + (this.cameras.main.height / this.SCALE) * 0.85
        );

        this.dialogueBox.visible = false;
    }

    createVillager(x, y, texture) {
        let villager = this.add.sprite(x, y, texture).setOrigin(0, 0);
        villager.isMoving = false; // Initialize the isMoving flag for each villager
        return villager;
    }

    update() {
        this.textInteract.setPosition(this.activeCharacter.x + 4, this.activeCharacter.y - 12);

        this.dialogueBox.setPosition(
            this.cameras.main.worldView.x + (this.cameras.main.width / this.SCALE) / 2,
            this.cameras.main.worldView.y + (this.cameras.main.height / this.SCALE) * 0.85
        );

        this.dialogueBox.visible = this.dialogueShowing;
        

        if (Phaser.Input.Keyboard.JustDown(this.cKey) && this.canRun) {
            if (!this.running) {
                this.walkingSpeed = 200;
                console.log("walking\n");
                this.running = true;
            } else {
                this.walkingSpeed = 100;
                console.log("running\n");
                this.running = false;
            }
        }
        
        //code for initial quest that unlocks running
        if (!this.questRunCompleted) {
            this.textRunQuestAvailable.visible = true;
            if(this.withinRangeOf(this.activeCharacter, this.questRun)) {
                console.log("In range of questRun");
                this.textInteract.visible = true;
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    //text box appears
                    if (!this.questRunAccepted) {
                        this.dialogueBox.setText("Villager: Arrow to the knee, huh? That sounds rough. I suggest you head SOUTH to the apothecary. His shop has a big mushroom patch out back. His potions can help.");
                        this.questRunAccepted = true;
                        this.toggleDialogue();
                    } else {
                        this.dialogueBox.setText("The apothecary? It should be at the SOUTHEASTERN part of town.");
                        this.toggleDialogue();
                    }
                    
                }
            }
        } else {
            this.textRunQuestAvailable.visible = false;
        }

        //code for apothocary quest line
        if (!this.questRunCompleted && this.questRunAccepted && !this.hasHoney) {
            this.textApothecaryQ.visible = true;
            if(this.withinRangeOf(this.activeCharacter, this.apothecary)) {
                console.log("In range of apothecary");
                this.textInteract.visible = true;
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    //text box appears
                    if (!this.questHoneyAccepted) {
                        this.dialogueBox.setText("I can heal your knee, unfortunately I do not have the honey needed for the potion. Could you go fetch me some honey? There should be some beehives in the EASTERN FORREST.");
                        // this.dialogueBox.setText("There you go, all better now! You should even be able to run around now! (Press \"C\" to toggle sprinting) By the way, do you mind getting some honey for me. There should be some beehives in the EASTERN FORREST.");
                        this.questHoneyAccepted = true;
                        this.toggleDialogue();
                    } else {
                        this.dialogueBox.setText("In order to heal your knee, I need honey. There should be some in the EASTERN FORREST.");
                        this.toggleDialogue();
                    }
                }
            }
        } else if (!this.questRunCompleted && this.hasHoney) {
            if(this.withinRangeOf(this.activeCharacter, this.apothecary)) {
                console.log("In range of apothecary");
                this.textInteract.visible = true;
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    //text box appears
                    this.dialogueBox.setText("You got the honey! There you go, all better now! You should even be able to run around now! (Press \"C\" to toggle sprinting)");
                    this.questRunCompleted = true;
                    this.canRun = true;
                    this.toggleDialogue();
                }
            }
        } else {
            this.textApothecaryQ.visible = false;
        }

        //code for picking up honey
        if (this.questHoneyAccepted && !this.questRunCompleted) {
            if(this.withinRangeOf(this.activeCharacter, this.honeyComb)) {
                console.log("In range of honey");
                this.textInteract.visible = true;
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    //text box appears
                    this.dialogueBox.setText("*Honey Collected*");
                    this.hasHoney = true;
                    this.toggleDialogue();
                }
            }
        }

        if(this.withinRangeOf(this.activeCharacter, this.retiredAdventurer)) {
            console.log("In range of retiredAdventurer");
            this.textInteract.visible = true;
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                //text box appears
                if (!this.questRunCompleted) {
                    this.dialogueBox.setText("I have a quest for you, but it is not for the weak. I believe it is best for you to get that knee healed first. Come back to me when you can run.");
                    this.toggleDialogue();
                } else {
                    this.questCartAccepted = true;
                    this.dialogueBox.setText("Legends speak of a portal to another world. A single path into the woods lies beyond the forest. There, a strange structure will bring you... elsewhere...");
                    this.toggleDialogue();
                }
            }
        }

        if (this.questCartAccepted) {
            //if the character is infront of the cart, they can end the game by pressing e
            if(this.activeCharacter.x == this.tileXtoWorld(45) && this.activeCharacter.y == this.tileYtoWorld(5)) {
                this.textInteract.visible = true;
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    console.log("end game");
                }
            }
        }

        //if the player is not near the interactables, make sure the dialoge and "E" are hidden
        if (!this.withinRangeOf(this.activeCharacter, this.apothecary) && !this.withinRangeOf(this.activeCharacter, this.questRun) && !this.withinRangeOf(this.activeCharacter, this.honeyComb) && !this.withinRangeOf(this.activeCharacter, this.retiredAdventurer) && (!(this.activeCharacter.x == this.tileXtoWorld(45) && this.activeCharacter.y == this.tileYtoWorld(5)))) {
            this.textInteract.visible = false;
            if (this.dialogueBox.visible) {
                this.toggleDialogue();
            }
        }
    }

    startVillagerTimer() {
        const randomDelay = Phaser.Math.Between(5000, 12000); // Random delay between 5 and 12 seconds
        console.log("Villager Move Timer: " + randomDelay/1000 + "s");

        this.time.addEvent({
            delay: randomDelay,
            callback: () => {
                this.moveRandomVillager();
                this.startVillagerTimer(); // Schedule the next timer
            },
            callbackScope: this,
        });
    }

    toggleDialogue() {
        if (this.dialogueShowing) {
            this.dialogueShowing = false;
        } else {
            this.dialogueShowing = true;
        }
    }

    moveRandomVillager() {
        // Filter out villagers that are currently moving
        let availableVillagers = this.villagers.filter(v => !v.isMoving);

        if (availableVillagers.length === 0) {
            return; // No available villagers to move
        }

        // Choose a random villager
        let randomVillager = Phaser.Utils.Array.GetRandom(availableVillagers);

        let x = Math.random() * 50;
        let y = Math.random() * 50;
        let toX = Math.floor(x);
        let toY = Math.floor(y);
        let fromX = Math.floor(randomVillager.x / this.TILESIZE);
        let fromY = Math.floor(randomVillager.y / this.TILESIZE);
        console.log('Villager going from (' + fromX + ',' + fromY + ') to (' + toX + ',' + toY + ')');

        this.finder.findPath(fromX, fromY, toX, toY, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
            } else {
                console.log(path);
                this.moveVillager(path, randomVillager);
            }
        });
        this.finder.calculate(); 
    }

    resetCost(tileset) {
        for (let tileID = tileset.firstgid; tileID < tileset.total; tileID++) {
            let props = tileset.getTileProperties(tileID);
            if (props != null) {
                if (props.cost != null) {
                    this.finder.setTileCost(tileID, 1);
                }
            }
        }
    }

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }

    // layersToGrid
    // Uses the tile layer information in this.map and outputs
    // an array which contains the tile ids of the visible tiles on screen.
    // This array can then be given to Easystar for use in path finding.
    layersToGrid() {
        let grid = [];
        // Initialize grid as two-dimensional array
        for (let i = 0; i < this.TILEHEIGHT; i += 1) {
            grid[i] = [];
            for (let j = 0; j < this.TILEWIDTH; j += 1) {
                grid[i][j] = -1;
            }
        }

        // Loop over layers to find tile IDs, store in grid
        for (let layer of this.map.layers) {
            for (let y = 0; y < this.TILEHEIGHT; y += 1) {
                for (let x = 0; x < this.TILEWIDTH; x += 1) {
                    let tile = layer.tilemapLayer.getTileAt(x, y);
                    if (tile != null) {
                        grid[y][x] = tile.index;
                    }
                }
            }
        }
        return grid;
    }

    handleClick(pointer) {
        if (this.isMoving) return;

        let x = pointer.worldX;
        let y = pointer.worldY;
        let toX = Math.floor(x / this.TILESIZE);
        let toY = Math.floor(y / this.TILESIZE);
        let fromX = Math.floor(this.activeCharacter.x / this.TILESIZE);
        let fromY = Math.floor(this.activeCharacter.y / this.TILESIZE);

        if (toX == fromX && toY == fromY) return;

        console.log('going from (' + fromX + ',' + fromY + ') to (' + toX + ',' + toY + ')');

        this.finder.findPath(fromX, fromY, toX, toY, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
            } else {
                console.log(path);
                this.moveCharacter(path, this.activeCharacter);
            }
        });
        this.finder.calculate(); // ask EasyStar to compute the path
        // When the path computing is done, the arrow function given with
        // this.finder.findPath() will be called.
    }

    moveCharacter(path, character) {
        this.isMoving = true;  // Set flag to true when movement starts

        // Sets up a list of tweens, one for each tile to walk, that will be chained by the timeline
        var tweens = [];
        for (var i = 0; i < path.length - 1; i++) {
            var ex = path[i + 1].x;
            var ey = path[i + 1].y;
            tweens.push({
                x: ex * this.TILESIZE,
                y: ey * this.TILESIZE,
                duration: this.walkingSpeed
            });
        }

        this.tweens.chain({
            targets: character,
            tweens: tweens,
            onComplete: () => {
                this.isMoving = false;  // Reset flag when movement is complete
            }
        });
    }

    moveVillager(path, villager) {
        villager.isMoving = true;  // Set flag to true when movement starts

        // Sets up a list of tweens, one for each tile to walk, that will be chained by the timeline
        var tweens = [];
        for (var i = 0; i < path.length - 1; i++) {
            var ex = path[i + 1].x;
            var ey = path[i + 1].y;
            tweens.push({
                x: ex * this.TILESIZE,
                y: ey * this.TILESIZE,
                duration: this.villagerWalkingSpeed
            });
        }

        this.tweens.chain({
            targets: villager,
            tweens: tweens,
            onComplete: () => {
                villager.isMoving = false;  // Reset flag when movement is complete
            }
        });
    }

    setCost(tileset) {
        // Iterate through all the tiles in the tileset
        for (let tileID = tileset.firstgid; tileID <= tileset.total; tileID++) {
            let props = tileset.getTileProperties(tileID);

            if (props && props.cost !== undefined) {
                let cost = props.cost;
                this.finder.setTileCost(tileID, cost);
            }
        }
    }

    withinRangeOf(a, b) {
        let buffer = 5;
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2) + buffer) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2) + buffer) return false;
        return true;
    }
}
