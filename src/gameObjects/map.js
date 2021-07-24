import Phaser from 'phaser';
import Hex from './hex';

export default class Map extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene);

        this.scene = scene;

        this.origin = {
            x: this.scene.sys.game.scale.gameSize.width/2,
            y: this.scene.sys.game.scale.gameSize.height/2
        }
        this.create()
    }

    create() {
        this.add(new Hex(
                this.scene, 
                this.origin.x, 
                this.origin.y,
                0xffffff,
                {width: 5, color: 0xaaaaaa, alpha: 1}
            )
        );
        this.add(new Hex(
            this.scene, 
            this.origin.x+30, 
            this.origin.y+Math.sqrt(3)*10,
            0xffffff,
            {width: 5, color: 0xaaaaaa, alpha: 1}
        ))
        this.add(new Hex(
            this.scene, 
            this.origin.x+30, 
            this.origin.y-Math.sqrt(3)*10,
            0xffffff,
            {width: 5, color: 0xaaaaaa, alpha: 1}
        ))
        this.add(new Hex(
            this.scene, 
            this.origin.x+60, 
            this.origin.y,
            0xffffff,
            {width: 5, color: 0xaaaaaa, alpha: 1}
        ))
    }
}