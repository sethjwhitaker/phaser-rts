import Peer from 'peerjs';

export class PeerClient {
    constructor() {
        this.client = new Peer();
        this.client.on('open', (id) => {
            console.log('Peer created. ID: ' + id);
            document.body.dispatchEvent(new CustomEvent("peerCreated", {detail: id}))
        });
        this.client.on('connection', (connection) => {
            console.log("Connection Request Received.")
            new PeerConnection(connection);
        });
        this.client.on('error', (error) => {
            console.log(error);
        })
    }

    /**
     * Connect to another user
     * 
     * @param {Number} id 
     */
    connect(id) {
        console.log("Sending Connection Request");
        console.log(id);
        new PeerConnection(this.client.connect(id));
    }

    getId() {
        return this.client.id
    }
}

/**
 * Handles p2p client connections.
 * 
 * @author Seth Whitaker
 */
export default class PeerConnection {
    /**
     * Creates a new PeerConnection object
     * 
     * @param {Peer.PeerConnection} connection 
     */
    constructor(connection) {
        this.connection = connection;

        /* Dispatch peerConnection event when a client connects */
        this.connection.on('open', () => {
            document.body.dispatchEvent(new CustomEvent("peerConnection", {detail: this}));
            console.log('Connection opened.');

            /* Handle received messages */
            this.connection.on('data', data => {
                console.log("message received: " + data);
                if(data.substr(0, 4) === "chat") {
                    document.body.dispatchEvent(new CustomEvent("chatReceived", {detail: data.substr(5)}));
                } else if (data.substr(0, 4) === "name") {
                    document.body.dispatchEvent(new CustomEvent("nameReceived", {detail: data.substr(5)}));
                } else if (data.substr(0, 5) === "input") {
                    document.body.dispatchEvent(new CustomEvent("inputReceived", {detail: data.substr(6)}))
                }
            });
            
        });
    }

    /**
     * Send user's display name 
     * 
     * @param {String} name 
     */
    sendName(name) {
        this.connection.send(`name ${name}`);
    }
    /**
     * Send a chat
     * 
     * @param {String} text 
     */
    sendChat(text) {
        this.connection.send(`chat ${text}`);
    }

    /**
     * Send an input event
     * 
     * @param {Object} input
     */
    sendInput(input) {
        this.connection.send(`input ${JSON.stringify(input)}`);
    }
}