import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Group {
    constructor(scene, options) {
        super(scene)

        this.peerId = options?.peerId
        this.name = options?.name
        this.color = options?.color
        this.isHuman = options?.isHuman

        this.ownedHexes = [];
        this.ownedUnits = [];

        this.selected = [];
    }

    select(rect) {
        this.scene.select(this, rect);
    }
}