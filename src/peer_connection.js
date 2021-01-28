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


export default class PeerConnection {

    constructor(connection) {
        console.log('PeerConnection constructor');
        this.connection = connection;
        this.connection.on('open', () => {
            document.body.dispatchEvent(new CustomEvent("peerConnection", {detail: this}));
            console.log('Connection opened.');

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

    sendName(name) {
        this.connection.send(`name ${name}`);
    }
    sendChat(text) {
        this.connection.send(`chat ${text}`);
    }

    static connect(id) {
        console.log("Sending Connection Request");
        new PeerConnection(client.connect(id));
    }
    static getId() {
        return client.id;
    }
}