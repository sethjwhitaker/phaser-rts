import Phaser from 'phaser';
import Map from '../gameObjects/map';

/**
 * The main scene of the game
 * 
 * @author Seth Whitaker
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'game'});

        this.lastChange = null;

        this.pointerMoveHandler = this.pointerMoveHandler.bind(this);
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

        this.input.on("pointermove", this.pointerMoveHandler)
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
            const dx = e.position.x-e.prevPosition.x
            const dy = e.position.y-e.prevPosition.y
            this.map.setX(this.map.x + dx)
            this.map.setY(this.map.y + dy)
        } else if(e.isDown) {
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
