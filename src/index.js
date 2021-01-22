import Phaser from 'phaser';
import ui from 'phaser-ui-tools';

const config = {
    type: Phaser.AUTO,
    scale: {
        width: 1280,
        height: 720,
    },
    autoCenter: Phaser.Scale.CENTER_BOTH,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

const game = new Phaser.Game(config);

function preload () {
    
}

function create () {
    const multiplayerButton = this.add.text(
        1280/2, 720/2, "Find a Match", {
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: {
                x: 10,
                y: 10
            }
        }
    ).setOrigin(.5);
}

function update() {

}