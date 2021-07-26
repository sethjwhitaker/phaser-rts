import Phaser from 'phaser';
import Map from '../gameObjects/map';
import Unit from '../gameObjects/unit';

/**
 * The main scene of the game
 * 
 * @author Seth Whitaker
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'game'});

        this.lastChange = null;

        this.selectRect = null;
        this.selected = null;

        this.pointerMoveHandler = this.pointerMoveHandler.bind(this);
        this.pointerUpHandler = this.pointerUpHandler.bind(this);
        this.finishSelect = this.finishSelect.bind(this);
    }

    /**
     * @inheritdoc
     */
    create(data) {

        this.peerConnection = data.peerConnection;
        this.scene.launch('chat-background', {peerConnection: this.peerConnection});
            
        this.map = new Map(
            this, 
            this.sys.game.scale.gameSize.width/2, 
            this.sys.game.scale.gameSize.height/2,
            0xffffff,
            {width: 5, color: 0xaaaaaa, alpha: 1}
        ); 

        this.add.existing(this.map);

        this.welcomeText = this.add.text(
            this.sys.game.scale.gameSize.width/2,
            this.sys.game.scale.gameSize.height/2, 
            "WELCOME TO GAME " + data.playerName.toUpperCase(), {
                color: "#ffffff",
                padding: {
                    x: 10,
                    y: 10
                }
            }
        ).setOrigin(.5);

        const quitButton = this.add.text(
            0,
            this.sys.game.scale.gameSize.height,
            "QUIT", 
            {
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: {
                    x: 10, 
                    y: 10
                }
            }
        ).setOrigin(.5).setInteractive();
        quitButton.x += quitButton.width/2;
        quitButton.y -= quitButton.height/2;
        quitButton.on("pointerup", () => {
            this.qbhandler();
        });

        const chatButton = this.add.text(
            0,
            this.sys.game.scale.gameSize.height,
            "CHAT", 
            {
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: {
                    x: 10, 
                    y: 10
                }
            }
        ).setOrigin(.5).setInteractive();
        chatButton.x += chatButton.width/2;
        chatButton.y -= chatButton.height*1.5;
        chatButton.on("pointerup", () => {
            this.chatButtonHandler();
        });

        const center = {
            x: 0,
            y:0 
        }
        this.add.existing(new Unit(this, {
                x: center.x+40,
                y: center.y+45
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x,
                y: center.y+60
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x-40,
                y: center.y+45
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x+40,
                y: center.y-45
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x,
                y: center.y-60
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x-40,
                y: center.y-45
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x-20,
                y: center.y
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x+20,
                y: center.y
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x-60,
                y: center.y
            }, 5, 0xffffff ))
        this.add.existing(new Unit(this, {
                x: center.x+60,
                y: center.y
            }, 5, 0xffffff ))

        //this.input.on("pointerdown", this.pointerDownHandler)
        this.input.on("pointermove", this.pointerMoveHandler)
        this.input.on("pointerup", this.pointerUpHandler)
        this.input.on("wheel", this.mouseWheelHandler)
    }

    /**
     * @inheritdoc
     */
    update(time, delta) {

        if(this.lastChange > 10) {
            this.lastChange = 0;
            var color = this.welcomeText.style.color;
            var newColor = "#"
            for(var i = 1; i < 7; i+=2) {
                var num = parseInt(color.substr(i, 2), 16);
                const rand = Math.random()
                if(rand>.5) {
                    num = Math.min(255,num+10);
                } else {
                    num = Math.max(0, num-10)
                }
                var newString = num.toString(16);
                if(newString.length < 2) {
                    newString = "0" + newString;
                }
                newColor += newString;
            }

            this.welcomeText.setStyle({
                color: newColor
            })

        } else {
            this.lastChange++;
        }
    }

    /**
     * Handles the mouse moving
     * 
     * @param {Object} e The event object
     */
    pointerMoveHandler(e) {
        if(e.rightButtonDown()) {
            const current = this.cameras.main.getWorldPoint(e.position.x, e.position.y);
            const previous = this.cameras.main.getWorldPoint(e.prevPosition.x, e.prevPosition.y)
            const dx = current.x-previous.x
            const dy = current.y-previous.y
            this.cameras.main.setScroll(
                this.cameras.main.scrollX - dx, 
                this.cameras.main.scrollY - dy
            )
        } else if(e.isDown) {
            if(this.selectRect) {
                this.selectRect.setSize(e.position.x-e.downX,e.position.y-e.downY)
            } else {
                //console.log(e);
                this.selected = null;
                this.selectRect = this.add.rectangle(
                    e.downX, e.downY, e.position.x-e.downX, e.position.y-e.downY,
                    0x555555, .3).setStrokeStyle(1, 0x000000, 1)
            }
        }
    }

    pointerUpHandler(e) {
        if(this.selectRect) {
            this.finishSelect(e)
        } else {
            if(this.selected) {
                console.log(this.map.getHexAt(e.position));
                this.selected = null;
            }
        }
    }

    /**
     * Handles the mouse wheel scrolling
     * 
     * @param {Object} e The event object
     */
    mouseWheelHandler(e) {
        const zoomIntensity = .001;
        const zoom = Math.max(0.5,Math.min(3,this.cameras.main.zoom-zoomIntensity*e.deltaY))
        this.cameras.main.setZoom(zoom);
    }

    finishSelect(e) {
        const shape = {
            x: this.selectRect.x,
            y: this.selectRect.y,
            width: this.selectRect.width,
            height: this.selectRect.height
        }

        this.selected = this.children.getChildren().filter(object => {
            if(object.selectable &&
                ((object.x >= shape.x && object.x <= shape.x+shape.width) ||
                (object.x <=shape.x && object.x >= shape.x+shape.width)) &&
                ((object.y >= shape.y && object.y <= shape.y+shape.height) ||
                (object.y <=shape.y && object.y >= shape.y+shape.height))
            ) return true;
        })

        this.selectRect.destroy()
        this.selectRect = null;
    }

    /**
     * Handles the quit button being pressed
     */
    qbhandler() {
        console.log('quit pressed')
        this.scene.stop('chat');
        this.scene.stop();
        this.scene.start('title');
    }

    /**
     * Handles the chat button being pressed
     */
    chatButtonHandler() {
        this.scene.setVisible(false);
        if(this.scene)
        if(this.scene.isSleeping('chat-foreground')) {
            console.log("woke")
            this.scene.wake('chat-foreground')
        }
        else {
            console.log("not woke")
            this.scene.launch('chat-foreground');
        }

    }
}
