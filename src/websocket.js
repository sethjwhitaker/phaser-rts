const protocol = "ws://";
const url = protocol + location.host;

export default class LobbyConnection {

    static client = null;
    static connected = false;
    static timeSincePing = null;
    static disconnectTimer = null;
    
    static joinLobby() {
        // TODO: handle possible errors such as calling join
        // lobby when a client instance already exists
        if(this.client === null) {
            this.client = new WebSocket(url);
            const el = document.createElement("div");
            document.body.appendChild(el);
        }
    
        this.client.onopen = () => {
            console.log("Connection opened");
            this.connected = true;
            this.client.send('Message From Client');
        }
    
        this.client.onerror = (error) => {
            console.log(`WebSocket error: ${error}`);
        }
    
        this.client.onmessage = (event) => {
            if(event.data === " ") {
                this.client.send(" ");

                this.pingReceived();
                    
            } else if(event.data === "?") {
                this.pingReceived();
            }
        };
    
        this.client.onclose = () => {
            console.log("Connection closed");
            this.clearTimers();
            this.connected = false;
        }
    }

    static leaveLobby() {
        this.client.close();
        this.client = null;
    }

    static pingReceived() {
        this.clearTimers();

        this.timeSincePing = setTimeout(() => {
            console.log("Not receiving ping from server");
            this.client.send("?");
            this.disconnectTimer = setTimeout(() => {
                console.log("Disconnected from server");
                this.client.close();
            }, 10000);
        }, 10000)
    }

    static clearTimers() {
        if(this.timeSincePing !== null) {
            clearTimeout(this.timeSincePing);
            this.timeSincePing = null;
        }
            
        if(this.disconnectTimer !== null) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
    }

}




