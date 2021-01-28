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
            });

            this.connection.send('Hello!');
            
        });
    }

    static connect(id) {
        console.log("Sending Connection Request");
        new PeerConnection(client.connect(id));
    }
    static getId() {
        return client.id;
    }
}