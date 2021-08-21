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

        this.startingPositions = null;

        /* Number of coordinates per pixel */
        this.hexSize = 50;
        this.createHexagonMap();

        this.scene.addToLogicUpdate(this);

        this.logicUpdate = this.logicUpdate.bind(this);
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

        this.startingPositions = hexagonMap.startingPositions;
    }

    load(hexFrames) {
        hexFrames.forEach(frame => {
            this.getHex(frame.id).load(frame)
        })
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

    getHex(id) {
        const hexes = this.getAll("id", id);
        return hexes[0];
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
        const adjacent = [];
        for(var i = 0; i < hexes.length; i++) {
            const current = hexes[i];
            if(current !== hex) {
                const tolerance = 171;
                const distance = Math.sqrt(
                    (hex.x-current.x)*(hex.x-current.x) +
                    (hex.y-current.y)*(hex.y-current.y));
                if(distance <= tolerance) {
                    adjacent.push(current);
                }
            }
        }
        return adjacent;
    }

    logicUpdate() {
        this.getAll().forEach(child => child.logicUpdate())
    }

    update() {
        this.getAll().forEach(child => child.update())
    }
}