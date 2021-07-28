import Phaser from 'phaser';
import Perspective from '../util/perspective';

/**
 * This is a GameObject representing one of the tiles.
 * 
 * @author Seth Whitaker
 */
export default class Hex extends Phaser.GameObjects.Polygon {
   /**
    * Instantiates a new hexagon object.
    * 
    * @param {Phaser.Scene} scene The scene this game object will 
    * belong to.
    * @param {Number} x X position of the hex
    * @param {Number} y Y position of the hex
    * @param {Number} color Fill color of the hex
    * @param {Object} border Stroke style of the hex
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

        /* Instantiate polygon */
        super(scene, x, y, Perspective.isometric2d(points), color);
        /* Center origin and set stroke style */
        this.setOrigin(0).setStrokeStyle(border.width, border.color, border.alpha);

        this.encapsulates = this.encapsulates.bind(this);
        this.addUnit = this.addUnit.bind(this);
        this.addUnits = this.addUnits.bind(this);

        this.unitSlots = Perspective.isometric2d([
            40, 45,
            0, 60,
            -40, 45,
            40, -45,
            0, -60,
            -40, -45,
            -20, 0,
            20, 0,
            -60, 0,
            60, 0
        ])
        this.units = [];
    }

    encapsulates(point) {
        // Add the center point of each hexagon IN MAP COORDINATES to the points 
        // before converting to screen coordinates
        // In screen coordinates, it's this.x and this.y
        const newPoints = this.geom.points.map(point => {
            const newPoint = [this.x+point.x, this.y+point.y]
            return newPoint;
        })
        const g = new Phaser.Geom.Polygon(newPoints);
        return g.contains(point.x, point.y);
    }

    addUnit(unit) {
        if(this.units.length >= 10) {
            return null;
        }

        this.units.push(unit);
        unit.addToHex(this);

        const index = 2*(this.units.length-1)
        unit.setPosition(this.x+this.unitSlots[index], this.y+this.unitSlots[index+1])
    }

    addUnits(units) {
        units.forEach(unit => this.addUnit(unit))
    }

    removeUnit(unit) {
        for(var i = 0; i < this.units.length; i++) {
            if(this.units[i] === unit) {
                this.units.splice(i, 1);
                break;
            }
        }
    }
}