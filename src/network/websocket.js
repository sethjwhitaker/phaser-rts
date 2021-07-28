const protocol = getProtocol();
const url = protocol + "//" + location.host;
const matchFoundEvent = new CustomEvent('matchFound', {detail: ""});

/**
 * Handles websocket connection to matchmaking server
 * 
 * @author Seth Whitaker
 */
export default class LobbyConnection {

    static client = null;
    static connected = false;
    static timeSincePing = null;
    static disconnectTimer = null;
    
    /**
     * Opens up a connection to the server
     * 
     * @param {String} playerName 
     */
    static joinLobby(playerName) {
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
            this.client.send('name ' + playerName);
        }
    
        this.client.onerror = (error) => {
            console.log(`WebSocket error: ${error}`);
        }
    
        this.client.onmessage = (event) => {
            console.log("(ws): " + event.data);
            if(event.data === " ") {
                this.client.send(" ");
                this.pingReceived();
            } else if(event.data === "?") {
                this.pingReceived();
            } else if(event.data === "match") {
                console.log("match message received");
                document.body.dispatchEvent(matchFoundEvent);
            } else if(event.data.substr(0, 4) === "peer") {
                console.log("peer message received");
                document.body.dispatchEvent(new CustomEvent('matchFound', {detail: event.data.substr(5)}));
            }
        };
    
        this.client.onclose = () => {
            console.log("Connection closed");
            this.clearTimers();
            this.connected = false;
        }
    }

    /**
     * Closes the connection to the server.
     */
    static leaveLobby() {
        this.client.close();
        this.client = null;
    }

    /**
     * Requests the server to find a match
     * 
     * @param {*} id
     */
    static waitForMatch(id) {
        this.client.send("match " + id);
        console.log("match message sent " + id);
    }

    /**
     * Checks to make sure client is still connected to server
     */
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

    /**
     * Cleans up ping timers
     */
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

/**
 * If http connection was secure, use secure ws connection
 * 
 * @returns {String} The protocol to use for connecting to server
 */
function getProtocol() {
    if(location.protocol == "https:")
        return "wss:"
    return "ws:"
}




