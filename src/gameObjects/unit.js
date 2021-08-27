import Phaser from 'phaser';
import Perspective from '../util/perspective';

export default class Unit extends Phaser.GameObjects.Container {
    static nextUnitId = 0;
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

        this.id = Unit.nextUnitId++;
        this.owned = player;
        player.ownedUnits++;

        this.logic = {
            id: this.id,
            x: startingPos.x,
            y: startingPos.y,
            shouldUpdate: false,
            logicShouldUpdate: false,
            attack: player.researches[0].obtained ? 2 : 1,
            health: player.researches[0].obtained ? 2 : 1,
            dying: -1,
            moving: false,
            destination: null,
            destinationHex: null,
            arriveNextUpdate: false,
            hex: null,
            hexSlot: null,
            selected: false
        }

        this.selectable = true;
        this.moveSpeed = 10;
        
        this.color = color ? color : 0xffffff;
        this.createSprite(scale);
        
        scene.addToLogicUpdate(this);

        this.setLogicPosition = this.setLogicPosition.bind(this);
        this.logicUpdate = this.logicUpdate.bind(this);
        this.sendTo = this.sendTo.bind(this);
        this.save = this.save.bind(this);
        this.load = this.load.bind(this);
        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
    }

    static createFromFrame(scene, frame) {
        console.log("Need to create units")
        const player = scene.player.id == frame.owned ? scene.player : scene.otherPlayer;
        const newUnit = new Unit(
            scene, 
            player,
            {x: frame.x, y: frame.y},
            scene.unitScale,
            player.color
        )
        newUnit.load(frame);
        scene.add.existing(newUnit)
    }

    static loadUnits(scene, frameUnits, nextUnitId) {
        console.log("LOAD UNITS")
        const sceneUnits = scene.children.getChildren().filter(child => child.constructor.name == "Unit");

        // Load nextUnitId
        Unit.nextUnitId = nextUnitId;


        frameUnits.forEach((frame, index) => {
            if(index < sceneUnits.length)
                sceneUnits[index].load(frame)
            else
                Unit.createFromFrame(scene, frame);
        })

        // Delete extra Units
        if(sceneUnits.length > frameUnits.length) {
            console.log("Need to delete units")
            for(var i = sceneUnits.length; i > frameUnits.length; i--) {
                console.log(sceneUnits[i-1].id)
                sceneUnits[i-1].destroy(); // Make sure to clean up player owned units
            }
            
        } 
    }

    load(frame) {
        console.log("LOAD UNIT")
        this.logic = frame;
        if(this.logic.destinationHex !== null) {
            this.logic.destinationHex = this.scene.map.getHex(this.logic.destinationHex);
        }
        if(this.logic.hex !== null) {
            this.logic.hex = this.scene.map.getHex(this.logic.hex);
        }
    }

    save() {
        const {
            destinationHex,
            hex,
            ...obj
        } = this.logic;
        obj.destinationHex = destinationHex ? destinationHex.id : null;
        obj.hex = hex ? hex.id : null;
        return obj
    }

    select() {
        this.logic.selected = true;
    }

    deselect(sceneDeselect) {
        if(this.logic.selected) {
            this.logic.selected = false;
            if(sceneDeselect !== false)
                this.scene.deselect(this.owned, this);
        }
    }

    setLogicPosition(pos) {
        this.logic.x = pos.x;
        this.logic.y = pos.y;
    }

    moveUnit(destination) {
        if(this.logic.hexSlot !== null) {
            this.logic.hex.unassignSlot(this);
        }
        this.sendTo(destination);
    }

    sendTo(destination) {
        if(isNaN(destination.x) || isNaN(destination.y)) {
            console.log("UNDEFINED DESTINATION")
            return;
        }
        this.logicShouldUpdate = true;
        this.logic.destination = destination;
        this.logic.destinationHex = this.scene.map.getHexAt(destination);
        this.logic.moving = true;
    }

    /**
     * Maintains a reference to the hex this unit belongs to
     * 
     * @param {Object} hex 
     */
    addToHex(hex) {
        if(this.logic.hex && this.logic.hex.active)
            this.logic.hex.removeUnit(this);
        this.logic.hex = hex;
    }

    fight(unit) {
        unit.logic.health -= this.logic.attack;
        this.logic.health -= unit.logic.attack;
        if(unit.logic.health <= 0) {
            unit.kill(this);
        }
        if(this.logic.health <= 0) {
            this.kill(unit);
        }
    }

    getFightDestination(unit) {
        const diff = 10;
        const dx = this.logic.x - unit.logic.x;
        const dy = this.logic.y - unit.logic.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan(Math.abs(dy/dx));
        const destination = {
            x: this.logic.x - Math.sign(dx) * Math.cos(angle) * (length/2-diff),
            y: this.logic.y - Math.sign(dy) * Math.sin(angle) * (length/2-diff)
        }

        return destination;
    }

    kill(killedBy) {
        /*
            Right now, the fight animation plays after the unit dies. 
            Make sure to change this when adding other types of units that might not die in one hit.
        */
        this.stopMoving();
        this.owned.ownedUnits--;

        /*
            This makes a unit not selectable anymore once it is dead. What if it was selected before it
            died though?
        */
        this.deselect();
        this.selectable = false;

        if(this.logic.hex && this.logic.hex.active) 
            this.logic.hex.removeUnit(this);
        this.logic.dying = 0;
        this.logic.logicShouldUpdate = true;
        this.scene.checkWinNextUpdate();
        if(killedBy) 
            this.logic.destination = this.getFightDestination(killedBy);
        else 
            this.dead = true;
    }

    stopMoving() {
        this.logic.destination = null;
        this.logic.destinationHex = null;
        this.logic.moving = false;
        this.logic.arriveNextUpdate = false;
    }
    
    arrive() {
        if(this.logic.hexSlot === null) { // If unit just enters hex, assign a slot
            this.logic.arriveNextUpdate = false;
            this.logic.hex.arriveUnit(this);
            return;
        }
        this.logic.x = this.logic.destination.x;
        this.logic.y = this.logic.destination.y;
        this.logic.shouldUpdate = false;
        this.stopMoving();
    }

    moveStep() {
        const dx = this.logic.destination.x - this.logic.x
        const dy = this.logic.destination.y - this.logic.y

        if(Math.abs(dx) <= this.moveSpeed && Math.abs(dy) <= this.moveSpeed) {
            this.logic.arriveNextUpdate = true;
        }

        const angle = Math.atan(Math.abs(dy/dx));
    
        this.logic.x += Math.sign(dx) * this.moveSpeed * Math.cos(angle);
        this.logic.y += Math.sign(dy) * this.moveSpeed * Math.sin(angle);
    }

    checkHex() {
        // Check if unit moved into a different hex
        const hex = this.scene.map.getHexAt({ x: this.logic.x, y: this.logic.y })

        // If unit moved into a different hex
        if(hex && this.logic.hex !== hex) {
            // Try to add the unit to the hex
            const added = hex.addUnit(this);

            // If it did not add
            if(!added) {
                // Make the unit arrive at previous hex
                this.logic.hex.arriveUnit(this);
            } // If it got added to its destination
            else if(added && hex === this.logic.destinationHex) {
                // Make the unit arrive at the new hex
                hex.arriveUnit(this);
            }
        }
    }

    logicUpdate() {
        if(this.logic.dying >= 0) {
            if(this.logic.arriveNextUpdate) {
                this.logic.x = this.logic.destination.x;
                this.logic.y = this.logic.destination.y;
                this.fighting = true;
                this.fightingTimer = 0;
                this.logic.arriveNextUpdate = false;
            } else if (this.dead && this.logic.dying >= 5) {
                this.logic.dying = -1;
                this.logic.logicShouldUpdate = false;
                this.destroy();
            } else if (this.dead) {
                this.logic.dying++;
                this.getAll().forEach(child => child.setFillStyle(child.fillColor, child.fillAlpha-.02))
            } else if (this.fighting) {
                this.fightingTimer++;
                if(this.fightingTimer <= 2) {
                    this.y--;
                } else if (this.fightingTimer <= 4) {
                    this.y++;
                } else {
                    this.dead = true;
                }
            } else {
                this.moveStep();
            }
        }
        if(this.logic.moving) {
            if(this.logic.arriveNextUpdate) {
                this.arrive();
            } else {
                this.moveStep();
                this.checkHex();
            }
        }
        this.logicUpdated = true;
    }

    update(time, delta) {
        if(this.x != this.logic.x || this.y != this.logic.y) {
            if(this.logicUpdated) {
                this.lerpStart = {
                    time: time,
                    x: this.x,
                    y: this.y
                }
                this.lerpEnd = {
                    time: time+this.scene.logicFrameDelay,
                    x: this.logic.x,
                    y: this.logic.y
                }
                this.logicUpdated = false;
            } else {
                const percentage = Math.min(1, (time-this.lerpStart.time)/
                        (this.lerpEnd.time-this.lerpStart.time));
                this.x = Phaser.Math.Linear(this.lerpStart.x, this.lerpEnd.x, percentage);
                this.y = Phaser.Math.Linear(this.lerpStart.y, this.lerpEnd.y, percentage);
            }
        }
        
    }

    createSprite(scale) {
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
            this.scene, 0, 0, topPoints, shadeColor(this.color, 0x2), 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
        this.add(new Phaser.GameObjects.Polygon(
            this.scene, 0, 0, leftPoints, shadeColor(this.color, 0x6), 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
        this.add(new Phaser.GameObjects.Polygon(
            this.scene, 0, 0, rightPoints, this.color, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
    }

    destroy() {
        this.scene.logicUpdates.splice(
                this.scene.logicUpdates.findIndex(obj => obj == this), 1)
        super.destroy();
    }
}