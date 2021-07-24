import Phaser from 'phaser';

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
    constructor(scene, x, y, color, border) {
        color = color ? color : 0xffffff;

        super(scene, x, y, 
            [
                -10, 10*Math.sqrt(3),
                10, 10*Math.sqrt(3),
                20, 0,
                10, -10*Math.sqrt(3),
                -10, -10*Math.sqrt(3),
                -20, 0
            ], color);
        this.setOrigin(0).setStrokeStyle(border.width, 
                border.color, border.alpha);
    }
}