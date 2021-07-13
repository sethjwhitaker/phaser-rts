import Phaser from 'phaser';
//import PeerConnection from '../peer_connection';

export default class ChatScene extends Phaser.Scene {
    constructor() {
        super({key: 'chat'});
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
    }

    create(data) {
        console.log("Chat Scene Loaded");
        const peerConnection = data.peerConnection;

        this.inputEl = document.createElement("input");
        this.inputEl.setAttribute('type', 'text');
        this.inputEl.setAttribute('id', 'chatbox');
        const inobj = this.add.dom(this.game.config.width/2, this.game.config.height-100, this.inputEl, {
            height: '30px', 
            width: `${this.game.config.width/2}px`,
            fontSize: `20px`,
        }).setInteractive().setOrigin(.5);

        

        const chatScroll = new ChatScroll();

        this.input.keyboard.on('keyup-ENTER', (event) => {
            if(document.activeElement.id === this.inputEl.id) {
                if(this.inputEl.value.length >0) {
                    if(peerConnection) peerConnection.sendChat(this.inputEl.value);
                    chatScroll.addChat(this.inputEl.value, false, this);
                    this.inputEl.value = "";
                }

            }
        });

        const backButton = this.add.text(
            0,
            this.sys.game.scale.gameSize.height,
            "Back", 
            {
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: {
                    x: 10, 
                    y: 10
                }
            }
        ).setOrigin(.5).setInteractive();
        backButton.x += backButton.width/2;
        backButton.y -= backButton.height/2;
        backButton.on("pointerup", () => {
            this.bbhandler();
        });

        document.body.addEventListener("chatReceived", (event) => {
            console.log("chat event heard");
            chatScroll.addChat(event.detail, true, this);
        })

        document.body.addEventListener("nameReceived", (event) => {
            const nameObj = this.add.text(this.sys.game.scale.gameSize.width/2, 0, event.detail, {
                color: '#ffffff',
                fontSize: 40,
                padding: {
                    x: 0,
                    y: 10
                }
            }).setOrigin(0.5, 0);
        })

        this.hide();
    }

    show() {
        this.inputEl.style.display = "inline-block";
        this.scene.setVisible(true);
    }

    hide() {
        this.inputEl.style.display = "none";
        this.scene.setVisible(false);
    }

    bbhandler() {
        console.log("back button pressed")
        this.hide();
        this.scene.setVisible(true, 'game');
    }
}

class ChatScroll {
    constructor() {
        this.chats = [];
    }
    
    addChat(text, leftSide, scene) {
        const x = leftSide ? scene.sys.game.scale.gameSize.width/4 : scene.sys.game.scale.gameSize.width-scene.sys.game.scale.gameSize.width/4;
        const textObj = scene.add.text(x, scene.sys.game.scale.gameSize.height-150, text, {
            color: `#ffffff`,
            fontSize: 20,
            padding: {
                x: 5,
                y: 5
            }
        });
        if(leftSide) textObj.setOrigin(0, 1);
        else textObj.setOrigin(1, 1);

        let current;
        for(let i = 0; i < this.chats.length; i++) {
            current = this.chats[i];
            current.y -= current.height;
        }


        this.chats.unshift(textObj);
    }

}