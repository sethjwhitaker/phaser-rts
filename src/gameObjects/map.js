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
        this.hexSize = 30;
        this.createHexagonMap();
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
}