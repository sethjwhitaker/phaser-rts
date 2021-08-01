import Phaser from 'phaser';
import Map from '../gameObjects/map';
import Player from '../gameObjects/player';


// MULTIPLAYER IS BROKE RIGHT NOW
/**
 * The main scene of the game
 * 
 * @author Seth Whitaker
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'game'});

        this.peerConnection = null;
        this.numPlayers = null;

        this.player = null;
        this.otherPlayer = null;

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

        const p1Options = {
            name: data.playerName,
            color: data.otherPlayerData?.position == 1 ? 0xff0000 : 0x0000ff
        }
        this.player = new Player(this, p1Options);

        if(this.numPlayers > 1) {
            const p2Options = {
                name: data.otherPlayerData.name,
                color: data.otherPlayerData.position == 1 ? 0x0000ff : 0xff0000,

            }
            this.otherPlayer = new Player(this, p2Options);
            this.peerConnection = data.peerConnection;
            this.scene.launch('chat-background', {peerConnection: this.peerConnection});
        } else {

        }

        this.map = new Map(
            this, 
            this.sys.game.scale.gameSize.width/2, 
            this.sys.game.scale.gameSize.height/2,
            0xffffff,
            {width: 5, color: 0xaaaaaa, alpha: 1}
        ); 

        this.add.existing(this.map);

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
            this.map.update()
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
        } else if(e.isDown && (!this.selected || this.selected.length ===0)) {
            const worldPosition = this.cameras.main.getWorldPoint(e.position.x, e.position.y);
            const worldDown = this.cameras.main.getWorldPoint(e.downX, e.downY);
            if(Math.abs(worldPosition.x - worldDown.x) >= 5 ||
                Math.abs(worldPosition.y - worldDown.y) >= 5) {
                if(this.selectRect) {
                    this.selectRect.setSize(worldPosition.x-worldDown.x,worldPosition.y-worldDown.y)
                } else {
                    //console.log(e);
                    this.selected = null;
                    this.selectRect = this.add.rectangle(
                        worldDown.x, worldDown.y, worldPosition.x-worldDown.x, worldPosition.y-worldDown.y,
                        0x555555, .3).setStrokeStyle(1, 0x000000, 1)
                }
            }
            
        }
    }

    /**
     * Handles mouse click up events
     * 
     * @param {Object} e The event object
     */
    pointerUpHandler(e) {
        console.log("pointer up")
        if(this.selectRect && this.selectRect.active) {
            console.log("finish select")
            this.finishSelect(e)
        } else {
            console.log("not finish select")
            const hex = this.map.getHexAt(this.cameras.main.getWorldPoint(e.position.x, e.position.y));
            if(this.selected) {
                console.log("Selected not null")
                hex?.addUnits(this.selected)
                this.selected = null;
            } else {
                console.log("CAPTURE YOUR MOM")
                hex?.capture();
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

    /**
     * Adds all selectable objects that are within the bounds of the selectRect
     * to the selected array. Destroys the selectRect after.
     * 
     * @param {Object} e The event object
     */
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
