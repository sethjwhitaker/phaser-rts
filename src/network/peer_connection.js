import Peer from 'peerjs';


const client = new Peer();
client.on('open', (id) => {
    console.log('Peer created. ID: ' + id);
});
client.on('connection', (connection) => {
    console.log("Connection Request Received.")
    new PeerConnection(connection);
});
client.on('error', (error) => {
    console.log(error);
})


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
                }
            });
            
        });
    }

    /**
     * Send user's display name to all connections
     * 
     * @param {String} name 
     */
    sendName(name) {
        this.connection.send(`name ${name}`);
    }
    /**
     * Send a chat to all other connections (this should be
     * changed to accept a userid)
     * 
     * @param {String} text 
     */
    sendChat(text) {
        this.connection.send(`chat ${text}`);
    }

    /**
     * Connect to another user
     * 
     * @param {Number} id 
     */
    static connect(id) {
        console.log("Sending Connection Request");
        new PeerConnection(client.connect(id));
    }
    /**
     * Returns the client id
     * 
     * @returns The client id
     */
    static getId() {
        return client.id;
    }
}