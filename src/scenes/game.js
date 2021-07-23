import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'game'});

        this.lastChange = null;
    }

    create(data) {

        this.peerConnection = data.peerConnection;
        this.scene.launch('chat-background', {peerConnection: this.peerConnection});

        this.hex = this.add.polygon(
            this.sys.game.scale.gameSize.width/2,
            this.sys.game.scale.gameSize.height/2, 
            [
                -100, 100*Math.sqrt(3),
                100, 100*Math.sqrt(3),
                200, 0,
                100, -100*Math.sqrt(3),
                -100, -100*Math.sqrt(3),
                -200, 0
            ],
            0xffffff
        ).setOrigin(0).setStrokeStyle(1, 0xff0000, 1);

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


    }

    update(time, delta) {

        if(this.lastChange > 10) {
            this.lastChange = 0;
            var color = "#";
            for(var i = 0; i < 6; i++)
                color += Math.floor(Math.random() * 16).toString(16)

            this.welcomeText.setStyle({
                color: color
            })
        } else {
            this.lastChange++;
        }
        
    }

    qbhandler() {
        console.log('quit pressed')
        this.scene.stop('chat');
        this.scene.stop();
        this.scene.start('title');
    }
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
