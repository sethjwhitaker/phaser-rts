import Phaser from 'phaser';
import Hex from './hex';
import hexagonMap from '../maps/hexagon_map.json';
import Perspective from '../util/perspective';

/**
 * A container for all the hexes in the game. Handles loading,
 * layout, and perspective of the tiles.
 * 
 * @author Seth Whitaker
 */
export default class Map extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene);

        this.scene = scene;

        this.fillColor = 0x49ba5f;
        this.strokeColor = 0x000000;
        this.origin = {
            x: this.scene.sys.game.scale.gameSize.width/2,
            y: this.scene.sys.game.scale.gameSize.height/2
        }
        /* Number of coordinates per pixel */
        this.hexSize = 50;
        this.createHexagonMap();

        this.mapToScreenCoordinates = this.mapToScreenCoordinates.bind(this);
    }

    /**
     * Loads the hex coordinates from the hexagonMap JSON file.
     * The coordinates of the hexagons should be based around a hexagon
     * size where the flat edge is sqrt(3) from the center, and the corner is 
     * 2 away from the center.
     */
    createHexagonMap() {
        var points = hexagonMap.points;
        points = points.map(point => this.hexSize*point)
        points = Perspective.isometric2d(points);

        for(var i = 0; i < points.length; i+= 2) {
            this.add(new Hex(
                this.scene,
                this.origin.x+points[i], 
                this.origin.y+points[i+1],
                this.hexSize,
                this.fillColor,
                {width: 2, color: this.strokeColor, alpha: 1}
            ))
        }
    }

    /**
     * Returns the origin of the map
     * 
     * @returns The origin
     */
    getOrigin() {
        return this.origin;
    }

    /**
     * Converts coordinates from map space to screen space
     * 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     * @returns {Object} The {x, y} position in screen space
     */
    mapToScreenCoordinates(x, y, z) {
        z = z ? z : 0;
        var result = Perspective.convertTo2d(Perspective.isometric3d([x, y, z]));
        return {x: this.origin.x + result[0], y: this.origin.y + result[1]};
    }

    /**
     * Returns a hex at the specified location
     * 
     * @param {Object} location The {x, y} location of the hex to return
     * @returns The hex at location
     */
    getHexAt(location) {
        const hexes = this.getAll();
        for(var i = 0; i < hexes.length; i++) {
            if(hexes[i].encapsulates(location)) return hexes[i]
        }
        return null;
    }

    /**
     * Gets the hexes before and after specified hex in the 
     * hexes array
     * 
     * @param {Object} hex 
     * @returns The hexes to the left and right in the hexes array
     */
    getAdjacentHexes(hex) {
        const hexes = this.getAll();
        for(var i = 0; i < hexes.length; i++) {
            if(hexes[i] === hex) {
                const left = i === 0 
                    ? hexes[hexes.length-1]
                    : hexes[i-1]
                const right = i === hexes.length-1
                    ? hexes[0]
                    : hexes[i+1]
                return [left, right];
            }
        }
    }

    update() {
        console.log("map update")
        this.getAll().forEach(child => child.update())
    }
}