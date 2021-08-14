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

    select(rect) {
        const inputObj = {
            timeStamp: this.time.now,
            type: "select", 
            rect: rect
        }
        this.sendInput(inputObj);
    }

    move(pos) {
        const inputObj = {
            timeStamp: this.time.now,
            type: "move",
            pos: pos
        }
        this.sendInput(inputObj);
    }


    /**
     * @inheritdoc
     */
    create(data) {
        console.log("Player Comms loaded");

        this.peerConnection = data.peerConnection;


        document.body.addEventListener("inputReceived", this.handleInputReceived);
    }

    update(time, delta) {
        if(time-this.lastMessageTime >= 200) {
            //console.log("send message")

            this.lastMessageTime = time;
        }
    }

    handleInputReceived(e) {
        const data = JSON.parse(e.detail)
        const gameScene = this.scene.get('game');
        switch(data.type) {
            case "select":
                gameScene.select(gameScene.otherPlayer, data.rect);
                break;
            case "move":
                gameScene.move(gameScene.otherPlayer, data.pos);
                break;

        }

    }

    sendInput(input) {
        this.peerConnection.sendInput(input)
    }

    
}