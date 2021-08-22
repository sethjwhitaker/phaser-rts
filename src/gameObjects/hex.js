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
    static nextHexId = 0;
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

        this.id = Hex.nextHexId++;
        /* Center origin and set stroke style */
        this.setOrigin(0).setStrokeStyle(border.width, border.color, border.alpha);

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
        this.logic = {
            slotsInUse: [],
            units: [],
            health: 0,
            owned: null,
            lastSpawnIndex: 1,
            ownedLastUpdate: 0
        }

        this.numSlots = 10;
        for(var i = 0; i < this.numSlots; i++) {
            this.logic.slotsInUse.push(false);
        }
        this.adjacentHexes = [];

        this.maxHealth = 10;

        this.encapsulates = this.encapsulates.bind(this);
        this.addUnit = this.addUnit.bind(this);
        this.addUnits = this.addUnits.bind(this);
        this.load = this.load.bind(this);
        this.save = this.save.bind(this);
        this.removeUnit = this.removeUnit.bind(this);
        this.assignSlot = this.assignSlot.bind(this);
        this.unassignSlot = this.unassignSlot.bind(this);
        this.canSpawn = this.canSpawn.bind(this);
    }

    load(frame) {
       // console.log("LOAD HEX")
        //console.log(frame)
        this.logic = frame;
        // slotsInUse []
        const newArr = [];
        for(var i = 0; i < this.numSlots; i++) {
            newArr.push(this.logic.slotsInUse.includes(i) ? true : false)
        }
        this.logic.slotsInUse = newArr;

        // units []
        this.logic.units = this.logic.units.map(id => {
            const u = this.scene.children.getChildren().find(child => {
                return child.constructor.name == "Unit" && child.id == id;
            })
            if(u === undefined) console.log(id + " is undefined")
            return u;
        })

        // owned
        if(this.logic.owned !== null) {
            this.logic.owned = this.scene.player.id === this.logic.owned 
                    ? this.scene.player : this.scene.otherPlayer;
        }

        //console.log(this.logic)
    }

    save() {
        const {
            slotsInUse,
            units,
            owned,
            ...obj
        } = this.logic;

        obj.slotsInUse = slotsInUse.map((slot, index) => {
            return slot === false ? false : index
        }).filter(slot => {
            return slot !== false
        })

        obj.units = units.map(unit => unit.id);
        obj.owned = owned !== null ? owned.id : null;
        obj.id = this.id;

        return obj
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
        if(this.logic.units.length > 0) {
            for(var i = 0; i < this.logic.units.length; i++) { 
                if(unit.owned != this.logic.units[i].owned) {
                    unit.fight(this.logic.units[i]);
                    return true;
                }
            }
        }

        /*if(this.logic.units.length > 0) {
            if(unit.owned != this.logic.units[0].owned) {
                unit.fight(this.logic.units[0]);
                return true;
            }
        }*/

        if(this.logic.units.length >= 10) {
            return false;
        }
        
        if(this.logic.owned !== null && this.logic.owned !== unit.owned) {
            this.attack(unit);
            return true;
        }

        this.logic.units.push(unit);
        unit.addToHex(this);

        //const index = 2*(this.logic.units.length-1)
        //unit.setPosition(this.x+this.unitSlots[index], this.y+this.unitSlots[index+1])

        this.checkOwned();

        return true;
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
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx*dx+dy*dy)
    }

    assignSlot(unit) {
        var index = this.logic.slotsInUse.indexOf(false);
        if(index < 0) {
            console.log("No Open Slots")
            return false // make it so units arriving at a full hex get directed elsewhere*/
        }

        var closestDistance = this.calculateDistance(
            unit.logic, 
            {
                x: this.x+this.unitSlots[2*index],
                y: this.y+this.unitSlots[2*index+1]
            }
        )
        for(var i = index+1; i < this.logic.slotsInUse.length; i++) {
            if(!this.logic.slotsInUse[i]) {
                const d = this.calculateDistance(
                    unit.logic, 
                    {
                        x: this.x+this.unitSlots[2*i],
                        y: this.y+this.unitSlots[2*i+1]
                    }
                )
                if(d < closestDistance) {
                    index = i;
                    closestDistance = d;
                }
            }
        }
        this.logic.slotsInUse[index] = true;
        unit.logic.hexSlot = index;
        unit.sendTo({x: this.x+this.unitSlots[2*index], y: this.y+this.unitSlots[2*index+1]})
        return true
    }

    unassignSlot(unit) {
        this.logic.slotsInUse[unit.logic.hexSlot] = false;
        unit.logic.hexSlot = null;
    }

    arriveUnit(unit) { 
        if(this.canSpawn()) {
            if(this.logic.owned === unit.owned) {
                this.sacrificeUnit(unit);
                return;
            }
            const assigned = this.assignSlot(unit);
            if(assigned) return;
        }

        const hex = this.getOpenAdjacentHex()
        if(hex) {
            unit.sendTo(hex)
        } else {
            unit.kill();
        }
    }

    /**
     * Removes a unit from this hex
     * 
     * @param {Object} unit The unit to remove
     */
    removeUnit(unit) {
        for(var i = 0; i < this.logic.units.length; i++) {
            if(this.logic.units[i] === unit) {
                if(this.logic.units[i].hexSlot !== null) {
                    this.unassignSlot(this.logic.units[i])
                }
                this.logic.units.splice(i, 1);
                break;
            }
        }
    }

    sacrificeUnit(unit) {
        if(this.logic.health < this.maxHealth) {
            this.logic.health += unit.logic.health;
            unit.kill();
            this.updateHealthBar();
        }
    }

    attack(unit) {
        if(this.logic.health > 0) {
            this.logic.health -= unit.logic.attack;
            unit.kill();
            this.updateHealthBar();
        } else {
            unit.kill();
            this.loseOwned();
        }
    }

    tryCapture(player) {
        if(this.logic.owned !== player) {
            if(this.logic.units.length === 10) {
                if(!this.logic.units.some(unit => unit.owned !== player))
                    this.capture(player);
            }
        }
    }

    capture(player) {
        this.logic.owned = player;
        player.ownedHexes++;
        this.setFillStyle(player.color);
        this.color = player.color;
        for(var i = this.logic.units.length-1; i >= 0; i--)
            this.logic.units[i].kill();
        this.updateHealthBar();
    }

    checkOwned() {
        if(this.logic.owned && this.logic.units.length > 0 && !this.logic.units.some(unit => unit.owned === this.logic.owned)) {
            this.loseOwned();
        }
    }

    loseOwned() {
        this.logic.owned.ownedHexes--;
        this.logic.owned = null;
        this.hideHealthBar();
        this.setFillStyle(0x49ba5f, 1);
        this.scene.checkForWin();
    }

    canSpawn(player) {
        if(this.logic.owned === player && this.logic.health >= this.maxHealth) {
            console.log("HAS MAX HEALTH")
            return false;
        }

        if(this.logic.units.length < 10) {
            console.log("HAS < 10 UNITS")
            return true;
        }

        if(this.logic.units.some(unit => unit.owned !== player)) {
            console.log("HAS >= 10 UNITS BUT SOME ARE BAD")
            return true;
        }

        console.log("DEFAULT")
        return false;
    }

    getOpenAdjacentHex() {
        var index = this.logic.lastSpawnIndex >= this.adjacentHexes.length - 1 
                ? 0 : this.logic.lastSpawnIndex + 1;
        var loop = true;
        while (loop) {
            if(index === this.logic.lastSpawnIndex) loop = false;
            const hex = this.adjacentHexes[index];
            if(hex.canSpawn(this.logic.owned)) {
                this.logic.lastSpawnIndex = index;
                return hex;
            } else {
                index = index === this.adjacentHexes.length - 1 
                ? 0 : index + 1;
            }
        }
        return null;
    }

    spawnUnit() {
        const hex = this.getOpenAdjacentHex();
        if(hex) {
            const unit = this.scene.add.existing(new Unit(this.scene, this.logic.owned, {
                x: 0,
                y: 0
            }, this.scene.unitScale, this.logic.owned.color))
            this.logic.units.push(unit);
            unit.addToHex(this);
            unit.setLogicPosition(this);
            unit.setPosition(this.x, this.y);
            unit.sendTo({x: hex.x, y: hex.y});
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
            this.healthBarWidth*this.logic.health/this.maxHealth, this.healthBarHeight,
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

    logicUpdate() {
        if(this.logic.owned) {
            if(this.logic.ownedLastUpdate >= 10) {
                this.spawnUnit();
                this.logic.ownedLastUpdate = 0;
            } else {
                this.logic.ownedLastUpdate++;
            }
        }
    }
}