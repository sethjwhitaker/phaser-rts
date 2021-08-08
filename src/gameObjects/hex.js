import Phaser from 'phaser';
import Unit from './unit';
import Perspective from '../util/perspective';

// Units kill their team mates for some reason
// Check if master has same issue
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

        this.color = color;

        this.healthBarWidth = 50;
        this.healthBarHeight = 10;

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
        this.adjacentHexes = [];

        this.health = 0;
        this.maxHealth = 10;

        this.state = {
            owned: null
        }

        this.lastSpawnIndex = 1;
        this.ownedLastUpdate = 0;
    }

    getAdjacentHexes() {
        this.adjacentHexes = this.scene.map.getAdjacentHexes(this);
        return this.adjacentHexes;
    }

    /**
     * Returns whether a point is within the bounds of this hex.
     * 
     * @param {Object} point The {x, y}
     *  point to check
     * @returns Whether this hex contains this point
     */
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

    /**
     * Adds a unit to this hex (mainly used for positioning)
     * 
     * @param {Object} unit The unit to add
     */
    addUnit(unit) {
        /*if(this.units.length > 0) {
            for(var i = 0; i < this.units.length; i++) { 
                if(unit.owned != this.units[i].owned) {
                    console.log(unit.owned)
                    console.log(this.units[i].owned)
                    console.log(this.units[i])
                    unit.fight(this.units[i]);
                    return;
                }
            }
        }*/
        
        if(this.state.owned !== null) {
            this.attack(unit);
            return;
        }

        if(this.units.length > 0) {
            if(unit.owned != this.units[0].owned) {
                unit.fight(this.units[0]);
                return;
            }
        }

        if(this.units.length >= 10) {
            return;
        }

        this.units.push(unit);
        unit.addToHex(this);

        //const index = 2*(this.units.length-1)
        //unit.setPosition(this.x+this.unitSlots[index], this.y+this.unitSlots[index+1])

        this.checkOwned();
    }

    /**
     * Adds multiple units to this hex
     * 
     * @param {Object[]} units The units to add
     */
    addUnits(units) {
        units.forEach(unit => {
            this.addUnit(unit)
        })
    }

    arriveUnit(unit) {
        if(this.state.owned === unit.owned) {
            this.sacrificeUnit(unit);
            return;
        }
        const index = 2*(this.units.length-1)
        unit.sendTo({x: this.x+this.unitSlots[index], y: this.y+this.unitSlots[index+1]})
    }

    /**
     * Removes a unit from this hex
     * 
     * @param {Object} unit The unit to remove
     */
    removeUnit(unit) {
        for(var i = 0; i < this.units.length; i++) {
            if(this.units[i] === unit) {
                this.units.splice(i, 1);
                break;
            }
        }
    }

    sacrificeUnit(unit) {
        if(this.health < this.maxHealth) {
            this.health += unit.health;
            unit.kill();
            this.updateHealthBar();
        }
    }

    attack(unit) {
        if(this.health > 0) {
            this.health -= unit.attack;
            unit.kill();
            this.updateHealthBar();
        } else {
            unit.kill();
            this.loseOwned();
        }
    }

    tryCapture(player) {
        if(this.state.owned !== player) {
            if(this.units.length === 10) {
                if(!this.units.some(unit => unit.owned !== player))
                    this.capture(player);
            }
        }
    }

    capture(player) {
        this.state.owned = player;
        this.setFillStyle(player.color);
        this.color = player.color;
        for(var i = this.units.length-1; i >= 0; i--)
            this.units[i].kill();
        this.updateHealthBar();
    }

    checkOwned() {
        if(this.units.length > 0 && !this.units.some(unit => unit.owned === this.state.owned)) {
            this.loseOwned();
        }
    }

    loseOwned() {
        this.state.owned = null;
        this.hideHealthBar();
        this.setFillStyle(0x49ba5f, 1);
    }

    spawnUnit() {
        var index = this.lastSpawnIndex >= this.adjacentHexes.length - 1 
                ? 0 : this.lastSpawnIndex + 1;
        var loop = true;
        while (loop) {
            if(index === this.lastSpawnIndex) loop = false;
            const hex = this.adjacentHexes[index];
            if(hex.units.length < 10) {
                const unit = this.scene.add.existing(new Unit(this.scene, this.state.owned, {
                    x: 0,
                    y: 0
                }, 5, this.state.owned.color))
                this.units.push(unit);
                unit.addToHex(this);
                unit.setPosition(this.x, this.y);
                unit.sendTo({x: hex.x, y: hex.y});
                this.lastSpawnIndex = index;
                break;
            } else {
                index = index === this.adjacentHexes.length - 1 
                ? 0 : index + 1;
            }
        }
    }

    showHealthBar() {
        this.healthBarContainer = this.scene.add.rectangle(
            this.x-this.healthBarWidth/2, this.y-this.healthBarHeight/2, 
            this.healthBarWidth, this.healthBarHeight,
            0x000000, 0
        ).setOrigin(0).setStrokeStyle(3, 0x000000, 1).setClosePath(true);
        this.createHealthBar();
        this.scene.uiLayer.add([this.healthBarContainer, this.healthBar])
    }

    createHealthBar() {
        this.healthBar = this.scene.add.rectangle(
            this.x-this.healthBarWidth/2, this.y-this.healthBarHeight/2, 
            this.healthBarWidth*this.health/this.maxHealth, this.healthBarHeight,
            0x00ff00, 1
        ).setOrigin(0).setStrokeStyle(3, 0x000000, 1).setClosePath(true);
    }

    updateHealthBar() {
        if(this.healthBar) {
            this.healthBar.destroy();
            this.createHealthBar();
            this.scene.uiLayer.add(this.healthBar)
        } else {
            this.showHealthBar();
        }
    }

    hideHealthBar() {
        if(this.healthBar && this.healthBar.active) {
            this.healthBarContainer.destroy()
            this.healthBar.destroy()
        }
        this.healthBarContainer = null;
        this.healthBar = null;
    }   

    update() {
        if(this.state.owned) {
            if(this.ownedLastUpdate >= 10) {
                console.log("yup")
                if(this.units.length < 10)
                    this.spawnUnit();
                this.ownedLastUpdate = 0;
            } else {
                if(this.state.owned)
                    this.ownedLastUpdate++;
            }
        }
    }
}