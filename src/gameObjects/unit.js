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
        player.ownedUnits++;

        this.hex = null;
        this.hexSlot = null;

        this.selectable = true;
        this.shouldUpdate = false;
        this.logicShouldUpdate = false;

        this.prevLogic = null;
        this.logic = {
            x: startingPos.x,
            y: startingPos.y
        }

        this.attack = 1;
        this.health = 1;
        this.dying = -1;

        this.moveSpeed = 10;
        this.moving = false;
        this.destination = null;
        this.destinationHex = null;
        this.arriveNextUpdate = false;
        
        this.color = color ? color : 0xffffff;
        this.createSprite();
        
        scene.addToLogicUpdate(this);

        this.setLogicPosition = this.setLogicPosition.bind(this);
        this.logicUpdate = this.logicUpdate.bind(this);
        this.sendTo = this.sendTo.bind(this);
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
        this.destination = destination;
        this.destinationHex = this.scene.map.getHexAt(destination);
        this.moving = true;
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
            unit.kill(this);
        }
        if(this.health <= 0) {
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
        this.dying = 0;
        this.logicShouldUpdate = true;
        this.scene.checkForWin();
        if(killedBy) 
            this.destination = this.getFightDestination(killedBy);
        else 
            this.dead = true;
    }

    stopMoving() {
        this.destination = null;
        this.destinationHex = null;
        this.moving = false;
        this.arriveNextUpdate = false;
    }
    
    arrive() {
        if(this.hexSlot === null) {
            this.arriveNextUpdate = false;
            this.hex.arriveUnit(this);
            return;
        }
        this.logic.x = this.destination.x;
        this.logic.y = this.destination.y;
        this.shouldUpdate = false;
        this.stopMoving();
    }

    moveStep() {
        const dx = this.destination.x - this.logic.x
        const dy = this.destination.y - this.logic.y

        if(Math.abs(dx) <= this.moveSpeed && Math.abs(dy) <= this.moveSpeed) {
            this.arriveNextUpdate = true;
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
            } else if(added && hex === this.destinationHex) {
                hex.arriveUnit(this);
            }
        }
    }

    logicUpdate() {
        if(this.dying >= 0) {
            if(this.arriveNextUpdate) {
                this.logic.x = this.destination.x;
                this.logic.y = this.destination.y;
                this.fighting = true;
                this.fightingTimer = 0;
                this.arriveNextUpdate = false;
            } else if (this.dead && this.dying >= 5) {
                this.dying = -1;
                this.logicShouldUpdate = false;
                this.destroy();
            } else if (this.dead) {
                this.dying++;
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
        if(this.moving) {
            if(this.arriveNextUpdate) {
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
                this.lerpStartTime = time;
                this.logicUpdated = false;
            } else {
                const percentage = (time-this.lerpStartTime)/this.scene.logicFrameDelay;
                Phaser.Math.Linear(this.x, this.logic.x, percentage);
                Phaser.Math.Linear(this.y, this.logic.y, percentage);
            }
        }
        
    }

    createSprite() {
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
            scene, 0, 0, topPoints, shadeColor(this.color, 0x2), 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
        this.add(new Phaser.GameObjects.Polygon(
            scene, 0, 0, leftPoints, shadeColor(this.color, 0x6), 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
        this.add(new Phaser.GameObjects.Polygon(
            scene, 0, 0, rightPoints, this.color, 1)
            .setOrigin(0)
            .setStrokeStyle(1, 0x000000, 1)
            .setClosePath(true)
        )
    }
}