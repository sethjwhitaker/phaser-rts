import Phaser from 'phaser';
import Perspective from '../util/perspective';

export default class Unit extends Phaser.GameObjects.Container {
    /**
     * Creates a new Unit
     * 
     * @param {Object} scene The scene to add this unit to
     * @param {Object} origin {x, y} position in map coordinates
     * @param {Number} scale The scale factor to apply to this unit
     * @param {Number} color The fill color
     */
    constructor(scene, origin, scale, color) {
        super(scene)

        origin = scene.map.mapToScreenCoordinates(origin.x, origin.y)
        color = color ? color : 0xffffff;
        const topPoints = Perspective.convertTo2d(Perspective.isometric3d([
            scale, scale, 2*scale,
            scale, -scale, 2*scale,
            -scale, -scale, 2*scale,
            -scale, scale, 2*scale
        ]));
        const leftPoints = Perspective.convertTo2d(Perspective.isometric3d([
            scale, scale, 2*scale,
            scale, scale, -2*scale,
            -scale, scale, -2*scale,
            -scale, scale, 2*scale
        ]));
        const rightPoints = Perspective.convertTo2d(Perspective.isometric3d([
            scale, scale, 2*scale,
            scale, scale, -2*scale,
            scale, -scale, -2*scale,
            scale, -scale, 2*scale
        ]));
        this.add(new Phaser.GameObjects.Polygon(
            scene, origin.x, origin.y, topPoints, color-0x222222, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
        )
        this.add(new Phaser.GameObjects.Polygon(
            scene, origin.x, origin.y, leftPoints, color-0x666666, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
        )
        this.add(new Phaser.GameObjects.Polygon(
            scene, origin.x, origin.y, rightPoints, color, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
        )
    }
}