import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'game'});
    }

    create(data) {
        this.add.text(
            this.sys.game.scale.gameSize.width/2,
            this.sys.game.scale.gameSize.height/2, 
            "WELCOME TO GAME " + data.playerName.toUpperCase(), {
                color: "#ffffff",
                padding: {
                    x: 10,
                    y: 10
                }
            }
        ).setOrigin(.5)
    }
}