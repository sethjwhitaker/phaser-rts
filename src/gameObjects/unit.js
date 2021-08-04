import Phaser from 'phaser';
import Perspective from '../util/perspective';

export default class Unit extends Phaser.GameObjects.Container {
    /**
     * Creates a new Unit
     * 
     * @param {Object} scene The scene to add this unit to
     * @param {Object} startingPos {x, y} position in map coordinates
     * @param {Number} scale The scale factor to apply to this unit
     * @param {Number} color The fill color
     */
    constructor(scene, player, startingPos, scale, color) {
        startingPos = scene.map.mapToScreenCoordinates(startingPos.x, startingPos.y)
        super(scene, startingPos.x, startingPos.y)

        this.owned = player;
        this.selectable = true;
        this.shouldUpdate = false;

        this.attack = 1;
        this.health = 1;
        this.dying = -1;
        
        color = color ? color : 0xffffff;
        const topPoints = Perspective.convertTo2d(Perspective.isometric3d([
            scale, scale, 4*scale,
            scale, -scale, 4*scale,
            -scale, -scale, 4*scale,
            -scale, scale, 4*scale
        ]));
        const leftPoints = Perspective.convertTo2d(Perspective.isometric3d([
            scale, scale, 4*scale,
            scale, scale, 0,
            -scale, scale, 0,
            -scale, scale, 4*scale
        ]));
        const rightPoints = Perspective.convertTo2d(Perspective.isometric3d([
            scale, scale, 4*scale,
            scale, scale, 0,
            scale, -scale, 0,
            scale, -scale, 4*scale
        ]));
        function shadeColor(color, shade) {
            var colorStr = color.toString(16);

            if(colorStr.length < 6) {
                const length = 6-colorStr.length;
                for(var i = 0; i < length; i++) {
                    colorStr = "0" + colorStr;
                }
            }

            var newColorStr = "";
            for (var i = 0; i < colorStr.length; i++) {
                const newDigit = parseInt(colorStr[i], 16)-shade;
                newColorStr = newColorStr + Math.max(newDigit, 0).toString(16);
            }

            return parseInt(newColorStr, 16);
        }
        this.add(new Phaser.GameObjects.Polygon(
            scene, 0, 0, topPoints, shadeColor(color, 0x2), 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
        this.add(new Phaser.GameObjects.Polygon(
            scene, 0, 0, leftPoints, shadeColor(color, 0x6), 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
        this.add(new Phaser.GameObjects.Polygon(
            scene, 0, 0, rightPoints, color, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )

        this.hex = null;
    }

    /**
     * Maintains a reference to the hex this unit belongs to
     * 
     * @param {Object} hex 
     */
    addToHex(hex) {
        if(this.hex && this.hex.active)
            this.hex.removeUnit(this);
        this.hex = hex;
    }

    fight(unit) {
        unit.health -= this.attack;
        this.health -= unit.attack;
        if(unit.health <= 0) {
            unit.kill();
        }
        if(this.health <= 0) {
            this.kill();
        }
    }

    kill() {
        this.selectable = false;
        if(this.hex && this.hex.active) 
            this.hex.removeUnit(this);
        this.dying = 0;
        this.shouldUpdate = true;
    }

    update() {
        if(this.dying >= 0) {
            if(this.dying >= 200) {
                this.dying = -1;
                this.shouldUpdate = false;
                this.destroy();
            }
            this.y -= 1;
            this.dying++;
        }
    }
}