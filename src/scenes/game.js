import Phaser from 'phaser';
import Map from '../gameObjects/map';
import Player from '../gameObjects/player';
import GameClock from '../util/game_clock';

/**
 * The main scene of the game
 * 
 * @author Seth Whitaker
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'game'});

        
        this.numPlayers = null;
        this.playerId = null;
        this.peerConnection = null;
        this.player = null;
        this.otherPlayer = null;
        this.lastChange = null;
        this.selectRect = null;
        this.startZoom1 = false;
        this.startZoom2 = false;
        this.ui = [];

        this.inputBuffer = [];
        this.gameClock = null;
        this.logicUpdates = [];
        this.logicFramesSinceStart = 0;
        this.logicFrameDelay = 200;

        this.startGameHandler = this.startGameHandler.bind(this);
        this.select = this.select.bind(this);
        this.move = this.move.bind(this);
        this.pointerMoveHandler = this.pointerMoveHandler.bind(this);
        this.pointerUpHandler = this.pointerUpHandler.bind(this);
        this.finishSelect = this.finishSelect.bind(this);
        this.click = this.click.bind(this);
        this.addToLogicUpdate = this.addToLogicUpdate.bind(this);
        this.logicUpdate = this.logicUpdate.bind(this);
    }

    /* 
    -------------------------------------------------------------------
                            Create Methods
    -------------------------------------------------------------------
    */
    createPlayers(data) {
        this.numPlayers = data.numPlayers;
        this.playerId = data.otherPlayerData?.position == 1 ? 2 : 1;

        const p1Options = {
            name: data.playerName,
            color: this.playerId == 1 ? 0xff0000 : 0x0000ff
        }
        this.player = new Player(this, p1Options);

        if(this.numPlayers > 1) {
            const p2Options = {
                name: data.otherPlayerData.name,
                color: this.playerId == 1 ? 0x0000ff : 0xff0000
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
    }

    createMap() {
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

        //this.map.getFirst().getAdjacentHexes()
        this.map.getAll().forEach(child => child.getAdjacentHexes())
        
        if(this.playerId == 1 ) {
            this.map.getAt(
                this.map.startingPositions[0]
            ).capture(this.otherPlayer)
            this.map.getAt(
                this.map.startingPositions[1]
            ).capture(this.player)
        } else {
            this.map.getAt(
                this.map.startingPositions[1]
            ).capture(this.otherPlayer)
            this.map.getAt(
                this.map.startingPositions[0]
            ).capture(this.player)
        }
    }

    createUI() {
        const quitButtonEl = document.createElement("button")
        quitButtonEl.innerHTML = "QUIT"

        this.quitButton = this.add.dom(
            0,
            this.sys.game.scale.gameSize.height,
            quitButtonEl
        ).setOrigin(.5).setInteractive();
        this.quitButton.x += this.quitButton.width/2 + 5;
        this.quitButton.y -= this.quitButton.height/2 + 7;
        this.quitButton.on("pointerup", () => {
            this.qbhandler();
        });

        this.ui.push(this.quitButton)

        const chatButtonEl = document.createElement("button")
        chatButtonEl.innerHTML = "CHAT"

        this.chatButton = this.add.dom(
            0,
            this.sys.game.scale.gameSize.height,
            chatButtonEl
        ).setOrigin(.5).setInteractive();
        this.chatButton.x += this.chatButton.width/2 + 5;
        this.chatButton.y -= this.quitButton.height*2 + 5;
        this.chatButton.on("pointerup", () => {
            this.chatButtonHandler();
        });

        this.ui.push(this.chatButton)
    }
    
    createEventListeners() {
        this.input.on("pointermove", this.pointerMoveHandler)
        this.input.on("pointerup", this.pointerUpHandler)
        this.input.on("wheel", this.mouseWheelHandler)
        document.body.addEventListener("startGame", this.startGameHandler)
    }

    /*
    ----------------------------------------------------------------------
                            Event Handlers
    ----------------------------------------------------------------------
    */

    /**
     * Handles the mouse moving
     * 
     * @param {Object} e The event object
     */
     pointerMoveHandler(e) {
        if(e.rightButtonDown()) {
            // Right button is down (panning)
            this.scrollCamera(e);
        } else if (this.input.manager.pointers[1].active && 
                   this.input.manager.pointers[2].active) {
            // 2 active pointers (touch pan/zoom)
            this.pinchZoom(e);
            this.scrollCamera(e);
        } else if(e.leftButtonDown() && (!this.selected || this.selected.length === 0)) {
            this.drag(e);
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
        this.startZoom1 = false;
        this.startZoom2 = false;
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

    startGameHandler(e) {
        const timeout = e.detail - this.gameClock.time();
        setTimeout(() => {
            this.startGame();
        }, timeout);
    }

    /*
    ----------------------------------------------------------------------
                            Controls
    ----------------------------------------------------------------------
    */

    playerInput(player, input) { 
        input.player = player ? player : this.player;
        input.activated = false;
        this.inputBuffer.push(input);
    }

    activateInput(input) {
        switch(input.type) {
            case "select":
                console.log("Select my guy")
                this.select(input.player, input.rect);
                break;
            case "move":
                this.move(input.player, input.pos);
                break;
        }
        input.activated = true;
    }

    startGame() {
        this.logicInterval = setInterval(this.logicUpdate, this.logicFrameDelay);
        this.startText = this.add.text(
            this.sys.game.scale.gameSize.width/2,
            this.sys.game.scale.gameSize.height/2,
            "GAME START!!!!!!"
        )
    }

    drag(e) {
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

        console.log("yup")
        if(player.selected) {// player previously selected units
            player.selected.forEach(unit => unit.moveUnit(pos))
            player.selected = null;
        } else if (player.selectedHex !== hex) { // player previously selected a hex
            player.selectHex(hex)
        } else {
            player.clickSelectedHex();
        }
    }

    scrollCamera(e) {
        const current = this.cameras.main.getWorldPoint(e.position.x, e.position.y);
            const previous = this.cameras.main.getWorldPoint(e.prevPosition.x, e.prevPosition.y)
            const dx = current.x-previous.x
            const dy = current.y-previous.y
            this.cameras.main.setScroll(
                this.cameras.main.scrollX - dx, 
                this.cameras.main.scrollY - dy
            )
    }

    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx*dx+dy*dy)
    }

    pinchZoom(e) {
        if(this.startZoom1 && this.startZoom2) {
            const p1 = this.input.manager.pointers[1];
            const p2 = this.input.manager.pointers[2];

            const d1 = this.calculateDistance(p1.prevPosition, p2.prevPosition);
            const d2 = this.calculateDistance(p1.position, p2.position);

            const zoomIntensity = .001;
            const zoom = Math.max(0.5,Math.min(3,this.cameras.main.zoom-zoomIntensity*(d1-d2)))
            this.cameras.main.setZoom(zoom);
        } else {
            if(e.id === 1) this.startZoom1 = true;
            else if(e.id === 2) this.startZoom2 = true;
        }
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

        this.scene.get('player-comm').select(shape, this.logicFramesSinceStart+1);


        this.selectRect.destroy()
        this.selectRect = null;
    }

    click(e) {
        const pos = this.cameras.main.getWorldPoint(e.position.x, e.position.y)

        this.scene.get('player-comm').move(pos, this.logicFramesSinceStart+1)
    }

    /*selectHex(e) {
        const pos = this.cameras.main.getWorldPoint(e.position.x, e.position.y)

        const hex = this.map.getHexAt(pos);
        if(hex) {
            if(this.numPlayers > 1)
                this.scene.get('player-comm').selectHex(pos, this.logicFramesSinceStart)
            this.move(this.player, pos)
        }
        
        this.player.selected = null;
    }*/

    /*
    ----------------------------------------------------------------------
                            Match End
    ----------------------------------------------------------------------
    */
    checkForWin() {
        console.log("CHECKING FOR WIN")
        const p1 = this.player.ownedUnits === 0 && this.player.ownedHexes === 0
        const p2 =  this.otherPlayer.ownedUnits === 0 && this.otherPlayer.ownedHexes === 0
        if(p2 && p1) this.draw();
        else if(p2) this.win(this.player)
        else if(p1) this.win(this.otherPlayer)
    }

    draw() {
        console.log("DRAW")
        this.add.text(
            this.sys.game.scale.gameSize.width/2,
            this.sys.game.scale.gameSize.height/2,
            "DRAW.", 
            {
                color: "#0000ff",
                padding: {
                    x: 10, 
                    y: 10
                }
            }
        ).setOrigin(.5)
    }

    win(player) {
        if(player === this.player) {
            console.log("YOU WIN")
            this.add.text(
                this.sys.game.scale.gameSize.width/2,
                this.sys.game.scale.gameSize.height/2,
                "CONGRATULATIONS! YOU WIN!", 
                {
                    color: "#00ff00",
                    padding: {
                        x: 10, 
                        y: 10
                    }
                }
            ).setOrigin(.5)
        } else {
            console.log("YOU LOSE")
            this.add.text(
                this.sys.game.scale.gameSize.width/2,
                this.sys.game.scale.gameSize.height/2,
                "SORRY. YOU LOSE.", 
                {
                    color: "#ff0000",
                    padding: {
                        x: 10, 
                        y: 10
                    }
                }
            ).setOrigin(.5)
        }
        
    }

    

    /*
    ----------------------------------------------------------------------
                                UI
    ----------------------------------------------------------------------
    */
    toggleDom() {
        this.ui.forEach(el => el.node.style.display =  
            el.node.style.display === "none" ? "block" : "none")
    }

    /**
     * Handles the quit button being pressed
     */
    qbhandler() {
        console.log('quit pressed')

        if(this.syncInterval)
            clearInterval(this.syncInterval);
        if(this.logicInterval)
            clearInterval(this.logicInterval)

        if(this.peerConnection)
            this.peerConnection.close();


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
        this.toggleDom();
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

    /*
    ----------------------------------------------------------------------
                                Phaser
    ----------------------------------------------------------------------
    */

    addToLogicUpdate(item) {
        if(item.logicUpdate) 
            this.logicUpdates.push(item);
    }

    logicUpdate() {
        var toRemove = [];
        console.log(this.logicFramesSinceStart)
        this.inputBuffer.forEach((input, index) => {
            if(!input.activated) {
                console.log(input.frame);
                if(input.frame === this.logicFramesSinceStart) {
                    console.log("input is on time")
                    this.activateInput(input);
                } else if(input.frame < this.logicFramesSinceStart) {
                    console.log("input is late")
                    if(input.frame < this.logicFramesSinceStart-10) {
                        toRemove.push(index);
                    }
                } else {
                    console.log("input is early")
                }
            } else {
                if(input.frame < this.logicFramesSinceStart-10) {
                    toRemove.push(index);
                }
            }
        })
        for(var i = toRemove.length-1; i >=0; i--) {
            this.inputBuffer.splice(toRemove[i], 1);
        }
        this.logicUpdates.forEach(item => {item.logicUpdate()})


        this.logicFramesSinceStart++;
    }

    /**
     * @inheritdoc
     */
     create(data) {
        this.createPlayers(data);
        this.createMap();
        this.createUI();
        this.createEventListeners();

        if(this.numPlayers > 1) {
            this.gameClock = new GameClock();
            if(this.playerId == 2) {
                this.gameClock.sync(this.peerConnection);
                /*this.syncInterval = setInterval(() => {
                    this.gameClock.sync(this.peerConnection);
                }, 10000)*/
            }
        }
        
    }

    /**
     * @inheritdoc
     */
    update(time, delta) {
        this.children.getChildren().forEach(child => {
            //if(child.shouldUpdate) 
            child.update();
        })
    }
}
