const url = "ws://localhost:3000";

export default class LobbyConnection {

    static client;
    static connected = false;
    
    static joinLobby() {
        // TODO: handle possible errors such as calling join
        // lobby when a client instance already exists
        
        this.client = new WebSocket(url);
        const el = document.createElement("div");
        document.body.appendChild(el);
    
        this.client.onopen = () => {
            console.log("Connection opened");
            this.connected = true;
            this.client.send('Message From Client');
        }
    
        this.client.onerror = (error) => {
            console.log(`WebSocket error: ${error}`);
        }
    
        this.client.onmessage = (event) => {
            el.innerHTML = 'Server time: ' + event.data;
        };
    
        this.client.onclose = () => {
            console.log("Connection closed");
            this.connected = false;
        }
    }

    static leaveLobby() {
        this.client.close();
    }
}



