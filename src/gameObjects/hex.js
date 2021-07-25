import Phaser from 'phaser';
import Perspective from '../util/perspective';

export default class Hex extends Phaser.GameObjects.Polygon {
   /**
    * Instantiates a new hexagon object.
    * 
    * @param {Phaser.Scene} scene The scene this game object will 
    * belong to.
    * @param {Number} x
    * @param {Number} y
    * @param {Number} color 
    * @param {Object} border 
    */
    constructor(scene, x, y, scale, color, border) {
        color = color ? color : 0xffffff;
        const points = [
            -scale, scale*Math.sqrt(3),
            scale, scale*Math.sqrt(3),
            2*scale, 0,
            scale, -scale*Math.sqrt(3),
            -scale, -scale*Math.sqrt(3),
            -2*scale, 0
        ]

        super(scene, x, y, 
            Perspective.isometric2d(points), color);
        this.setOrigin(0).setStrokeStyle(border.width, 
                border.color, border.alpha);
    }
}