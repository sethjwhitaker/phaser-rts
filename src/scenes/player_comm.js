import Phaser from 'phaser';

/**
 * Handles sending and receiveing chats (runs in the background)
 * 
 * @author Seth Whitaker
 */
export default class PlayerComm extends Phaser.Scene {
    constructor() {
        super({key: 'player-comm'});

        this.peerConnection = null;
        
        this.lastMessageTime = 0;

        this.select = this.select.bind(this);
        this.move = this.move.bind(this);
        this.handleInputReceived = this.handleInputReceived.bind(this);
        this.sendInput = this.sendInput.bind(this);
    }

    select(rect, frame) {
        console.log(rect, frame)
        const inputObj = {
            frame: frame,
            type: "select", 
            rect: rect
        }
        if(this.peerConnection)
            this.sendInput(JSON.stringify(inputObj));
        this.localInput(inputObj);
    }

    move(pos, frame) {
        const inputObj = {
            frame: frame,
            type: "move",
            pos: pos
        }
        if(this.peerConnection)
            this.sendInput(JSON.stringify(inputObj));
        this.localInput(inputObj);
    }

    /**
     * @inheritdoc
     */
    create(data) {
        console.log("Player Comms loaded");

        this.peerConnection = data.peerConnection;


        document.body.addEventListener("inputReceived", this.handleInputReceived);
    }

    localInput(input) {
        const gameScene = this.scene.get('game');
        gameScene.playerInput(gameScene.player, input);
    }

    handleInputReceived(e) {
        const data = JSON.parse(e.detail)
        const gameScene = this.scene.get('game');
        gameScene.playerInput(gameScene.otherPlayer, data);
    }

    sendInput(input) {
        setTimeout(() => { // THis timeout is just for testing LAG MAKE SURE TO REMOVE
            this.peerConnection.sendInput(input)
        }, 600)
        
    }

    
}