import Phaser from 'phaser';

/**
 * Handles sending and receiveing chats (runs in the background)
 * 
 * @author Seth Whitaker
 */
export default class ChatBackground extends Phaser.Scene {
    constructor() {
        super({key: 'chat-background'});

        this.getChats = this.getChats.bind(this);
        this.receiveChat = this.receiveChat.bind(this);
        this.sendChat = this.sendChat.bind(this);

        this.peerConnection = null;
        this.name = null;
        this.chats = [];
    }

    /**
     * @inheritdoc
     */
    create(data) {
        console.log("Chat Background Loaded");

        this.peerConnection = data.peerConnection;

        document.body.addEventListener("chatReceived", this.receiveChat)
        document.body.addEventListener("nameReceived", (e) => {
            this.name = e.detail;
        })
    }

    /**
     * Returns the chats
     * 
     * @returns {Object[]} The chats array
     */
    getChats() {
        return this.chats;
    }

    /**
     * Handles chat received event
     * 
     * @param {Object} e Chat event
     */
    receiveChat(e) {
        console.log(this.chats)
        const newChat = {
            text: e.detail,
            myChat: false, // TODO: replace with the userid who sent it
            timeStamp: null // TODO: replace with received time
        }
        this.chats.push(newChat)
        if(this.scene.isActive('chat-foreground')) {
            console.log("not sleeping")
            this.scene.get('chat-foreground').addChat(newChat);
        }
    }

    /**
     * Sends a chat to the connected peer
     * 
     * @param {String} text The chat message to send
     */
    sendChat(text) {
        if(this.peerConnection) 
            this.peerConnection.sendChat(text); // TODO: Reconfigure to use user ids in the future
        const newChat = {
            text: text,
            myChat: true, // TODO: replace with my userid
            timeStamp: null // TODO: replace with current time
        }
        this.chats.push(newChat);
        if(!this.scene.isSleeping('chat-foreground')) {
            this.scene.get('chat-foreground').addChat(newChat);
        }
    }
}