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

        this.villagers.push(this.createVillager(this.tileXtoWorld(14), this.tileYtoWorld(5), "purple"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(23), this.tileYtoWorld(5), "blue"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(5), this.tileYtoWorld(15), "purple"));
        this.villagers.push(this.createVillager(this.tileXtoWorld(14), this.tileYtoWorld(15), "blue"));
        
        this.questHeal = this.add.sprite(this.tileXtoWorld(5), this.tileYtoWorld(6), "character").setOrigin(0, 0);

        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels);
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
        this.walking = true;
        this.setCost(this.tileset);

        // Start the villager movement timer
        this.startVillagerTimer();

        //text
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

        //text
        this.dialogueBox = this.add.text(20, 20, "HIIIII", {
            fontFamily: 'Arial',
            fontSize: '16px',
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: { x: 10, y: 5 },
            wordWrap: { width: this.cameras.main.width - 20 }
        });
        this.textInteract.setOrigin(0, 0); // Center the text horizontally

        this.dialogueBox.visible = true;
    }

    createVillager(x, y, texture) {
        let villager = this.add.sprite(x, y, texture).setOrigin(0, 0);
        villager.isMoving = false; // Initialize the isMoving flag for each villager
        return villager;
    }

    update() {
        this.textInteract.setPosition(this.activeCharacter.x + 4, this.activeCharacter.y - 12);

        if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
            if (!this.walking) {
                // Make the path low cost with respect to grassy areas
                // this.setCost(this.tileset);
                // this.lowCost = true;
                this.walkingSpeed = 200;
                console.log("Walking\n");
                this.walking = false;
            } else {
                // Restore everything to same cost
                // this.resetCost(this.tileset);
                // this.lowCost = false;
                this.walkingSpeed = 100;
                console.log("Running\n");
            }
        }

        if(this.withinRangeOf(this.activeCharacter, this.questHeal)) {
            console.log("In range of questHeal");
            this.textInteract.visible = true;
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                //text box appears
                console.log("toggle text box");
            }
        } else {
            this.textInteract.visible = false;
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
