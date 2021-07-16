import Phaser from 'phaser';

export default class ChatForeground extends Phaser.Scene {
    constructor() {
        super({key: 'chat-foreground'});

        this.backButtonHandler = this.backButtonHandler.bind(this);
        this.loadChats = this.loadChats.bind(this);
        this.addChat = this.addChat.bind(this);

        this.chatTextObjs = [];
    }

    create(data) {
        console.log("Chat Foreground Loaded");

        this.inputEl = document.createElement("input");
        this.inputEl.setAttribute('type', 'text');
        this.inputEl.setAttribute('id', 'chatbox');
        this.add.dom(
            this.game.config.width/2, 
            this.game.config.height-100, 
            this.inputEl, {
                height: '30px', 
                width: `${this.game.config.width/2}px`,
                fontSize: '20px',
            }
        ).setInteractive().setOrigin(.5);

        this.input.keyboard.on('keyup-ENTER', (event) => {
            if(document.activeElement.id === this.inputEl.id) {
                if(this.inputEl.value.length >0) {
                    this.scene.get('chat-background').sendChat(this.inputEl.value);
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
        backButton.on("pointerup", this.backButtonHandler);

        this.loadChats();
    }

    backButtonHandler() {
        console.log("back button pressed")
        this.scene.sleep().setVisible(true, 'game')
    }

    loadChats() {
        this.scene.get('chat-background').getChats().forEach(chat => {
            this.addChat(chat);
        })
    }

    addChat(chat) {
        console.log("chat is being added")
        const x = !chat.myChat ? this.sys.game.scale.gameSize.width/4 : 
            this.sys.game.scale.gameSize.width-this.sys.game.scale.gameSize.width/4;
        const textObj = this.add.text(x, this.sys.game.scale.gameSize.height-150, chat.text, {
            color: `#ffffff`,
            fontSize: 20,
            padding: {
                x: 5,
                y: 5
            }
        });
        if(chat.myChat) textObj.setOrigin(1, 1);
        else textObj.setOrigin(0, 1);

        let current;
        for(let i = 0; i < this.chatTextObjs.length; i++) {
            current = this.chatTextObjs[i];
            current.y -= current.height;
        }

        this.chatTextObjs.unshift(textObj);
    }
}
