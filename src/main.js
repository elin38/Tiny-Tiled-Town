// Ethan Lin
// Created: 6/7/2024
// Phaser: 3.80.0
//
// Based off of Professor Jim Whitehead's
// Pathfinder demo
//
// An example of pathfinding in Phaser using the EasyStar.js pathfinder 
// https://github.com/prettymuchbryce/easystarjs
// 
// Assets from the following Kenney Asset packs
// Tiny Dungeon
// https://kenney.nl/assets/tiny-dungeon
//
// Tiny Town
// https://kenney.nl/assets/tiny-town
//


// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 1280,
    height: 800,
    scene: [Load, Title, TinyTown, End]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}};

const game = new Phaser.Game(config);