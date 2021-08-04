import Phaser from 'phaser';
import Map from '../gameObjects/map';
import Player from '../gameObjects/player';


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


        this.select = this.select.bind(this);
        this.move = this.move.bind(this);
        this.pointerMoveHandler = this.pointerMoveHandler.bind(this);
        this.pointerUpHandler = this.pointerUpHandler.bind(this);
        this.finishSelect = this.finishSelect.bind(this);
        this.click = this.click.bind(this);
    }

    /**
     * @inheritdoc
     */
    create(data) {
        this.numPlayers = data.numPlayers;
        this.position = data.otherPlayerData?.position == 1 ? 2 : 1;
        console.log(this.position)

        const p1Options = {
            name: data.playerName,
            color: this.position == 1 ? 0xff0000 : 0x0000ff
        }
        this.player = new Player(this, p1Options);

        if(this.numPlayers > 1) {
            const p2Options = {
                name: data.otherPlayerData.name,
                color: this.position == 1 ? 0x0000ff : 0xff0000,

            }
            this.otherPlayer = new Player(this, p2Options);
            this.peerConnection = data.peerConnection;
            this.scene.launch('player-comm', {peerConnection: this.peerConnection})
            this.scene.launch('chat-background', {peerConnection: this.peerConnection});
        } else {
            const p2Options = {
                name: "CPU",
                color: 0x999999
            }
            this.otherPlayer = new Player(this, p2Options);
        }
        this.mapLayer = new Phaser.GameObjects.Layer(this)
                .setDepth(0).setVisible(true);
        this.add.existing(this.mapLayer);
        this.uiLayer = new Phaser.GameObjects.Layer(this)
                .setDepth(1).setVisible(true);
        this.add.existing(this.uiLayer)
        


        this.map = new Map(
            this, 
            this.sys.game.scale.gameSize.width/2, 
            this.sys.game.scale.gameSize.height/2,
            0xffffff,
            {width: 5, color: 0xaaaaaa, alpha: 1}
        ); 

        this.add.existing(this.map);
        this.mapLayer.add(this.map);

        
        if(this.position == 1 ) {
            this.map.getAt(5).capture(this.otherPlayer)
            this.map.getAt(1).capture(this.player)
        } else {
            this.map.getAt(1).capture(this.otherPlayer)
            this.map.getAt(5).capture(this.player)
        }
        

        

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
        this.children.getChildren().forEach(child => {
            if(child.shouldUpdate) child.update();
        })
        if(this.lastChange > 10) {
            this.lastChange = 0;
            this.map.update()
        } else {
            this.lastChange++;
        }
    }

    select(player, rect) {
        console.log("select")
        player.selected = this.children.getChildren().filter(object => {
            console.log(object.selectable)
            if(object.selectable && object.owned === player &&
                ((object.x >= rect.x && object.x <= rect.x+rect.width) ||
                (object.x <=rect.x && object.x >= rect.x+rect.width)) &&
                ((object.y >= rect.y && object.y <= rect.y+rect.height) ||
                (object.y <=rect.y && object.y >= rect.y+rect.height))
            ) return true;
        })
    }

    move(player, pos) {
        console.log("click")
        const hex = this.map.getHexAt(pos);
        if(!hex) return;

        if(player.selected) {
            hex?.addUnits(player.selected)
            player.selected = null;
        } else if (player.selectedHex !== hex) {
            player.selectHex(hex)
        } else {
            player.clickSelectedHex();
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
        // Finished selecting
        if(this.selectRect && this.selectRect.active) {
            this.finishSelect(e)
        } else {
            this.click(e);
            
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

        this.scene.get('player-comm').select(shape);
        this.select(this.player, shape);

        this.selectRect.destroy()
        this.selectRect = null;
    }

    click(e) {
        const pos = this.cameras.main.getWorldPoint(e.position.x, e.position.y)

        this.scene.get('player-comm').move(pos)
        this.move(this.player, pos)
    
    }

    selectHex(e) {
        const pos = this.cameras.main.getWorldPoint(e.position.x, e.position.y)

        const hex = this.map.getHexAt(pos);
        if(hex) {
            
        }
        this.scene.get('player-comm').selectHex(pos)
        this.move(this.player, pos)
        
        this.player.selected = null;
    }

    /**
     * Handles the quit button being pressed
     */
    qbhandler() {
        console.log('quit pressed')
        this.scene.stop('player-comm')
        this.scene.stop('chat-background')
        this.scene.stop('chat-foreground')
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
