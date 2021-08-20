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

        this.hex = null;
        this.hexSlot = null;

        this.selectable = true;

        //this.prevLogic = null;
        this.logic = {
            id: this.id,
            x: startingPos.x,
            y: startingPos.y,
            shouldUpdate: false,
            logicShouldUpdate: false,
            attack: 1,
            health: 1,
            dying: -1,
            moving: false,
            destination: null,
            destinationHex: null,
            arriveNextUpdate: false
        }

        this.moveSpeed = 10;
        
        this.color = color ? color : 0xffffff;
        this.createSprite(scale);
        
        scene.addToLogicUpdate(this);

        this.setLogicPosition = this.setLogicPosition.bind(this);
        this.logicUpdate = this.logicUpdate.bind(this);
        this.sendTo = this.sendTo.bind(this);
    }

    save() {
        const obj = {
            ...this.logic,
            destinationHex: this.logic.destinationHex 
                    ? this.logic.destinationHex.id : null
        };
        console.log(obj)
        return obj
    }

    setLogicPosition(pos) {
        this.logic.x = pos.x;
        this.logic.y = pos.y;
    }

    moveUnit(destination) {
        if(this.hexSlot !== null) {
            this.hex.slotsInUse[this.hexSlot] = false;
            this.hexSlot = null;
        }
        this.sendTo(destination);
    }

    sendTo(destination) {
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
        if(this.hex && this.hex.active)
            this.hex.removeUnit(this);
        this.hex = hex;
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
        this.stopMoving();
        this.owned.ownedUnits--;
        this.selectable = false;
        if(this.hex && this.hex.active) 
            this.hex.removeUnit(this);
        this.logic.dying = 0;
        this.logic.logicShouldUpdate = true;
        this.scene.checkForWin();
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
        if(this.hexSlot === null) {
            this.logic.arriveNextUpdate = false;
            this.hex.arriveUnit(this);
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
        const hex = this.scene.map.getHexAt({ x: this.logic.x, y: this.logic.y })
        if(hex && this.hex !== hex) {
            const added = hex.addUnit(this);
            if(!added) {
                this.hex.arriveUnit(this);
            } else if(added && hex === this.logic.destinationHex) {
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
}