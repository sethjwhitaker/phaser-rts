import express from 'express';
import { Server } from 'ws';
import path from 'path';
import webpackConfig from '../webpack.dev.js';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

/**
 * A dev version of the websocket server that handles
 * matchmaking for the game.
 * 
 * @author Seth Whitaker
 */

/* Open up a connection on port 80 or specified port */
const port = process.env.PORT || 80;
const app = express();

/* Hot reloading for dev */
// TODO: Make dev version separate from prod version
const compiler = webpack(webpackConfig);
app.use(
    webpackDevMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath
    })
);

/* Serve the files in the dist/ folder */
app.use(express.static(path.join(__dirname, '../dist')));
const server = app.listen(port, () => {
    console.log(`Websocket server started on port ` + port);
});

/* Start a new websocket server */
const wss = new Server({ server: server });

let ID = 0;
/* Called when a client connects */
wss.on('connection', (ws) => {
    console.log('Client connected');

    /* Send a ping every 5 seconds. If 2 or more pings go 
     * without responses close the connection. */
    const pingint = setInterval(() => {
        if (ws.missedPongs >= 2) {
            console.log("Client not responding.")
            ws.close();
        } else {
            if(ws.awaitingPong === true) {
                ws.missedPongs++;
            }
            ws.send(" ");
            ws.awaitingPong = true;
        }

        
    }, 5000);

    /* Handle client disconnect */
    ws.on('close', () => {
        console.log('Client disconnected')
        if(pingint) clearInterval(pingint);
    });

    ws.missedPongs = 0;
    ws.awaitingPong = false;
    /* Handle message received */
    ws.on('message', (message) => {
        console.log(message);
        
        // pong received
        if(message === " ") {
            ws.awaitingPong = false;
            ws.missedPongs = 0;
        // client asks if still connected
        } else if(message === "?") {
            ws.send("?");
        // client sends name to be sent to others looking for match
        } else if(message.substr(0, 4) === "name") {
            ws.name = message.substr(5);
            playerJoined(ws);
            console.log("client " + ws.id + ": " + ws.name);
        } else if(message.substr(0, 5) === "match") {
            console.log("match message received");
            ws.peerId = message.substr(6);
            wss.clients.forEach(client => {
                if(client.id === ws.matchId) client.send("peer " + ws.peerId);
            });
            console.log("Match: " + ws.id + " " + ws.matchId);
        }
        
    });

    /**
     * Match all clients together.
     * 
     * @param {WebSocket} ws The client connection
     */
    function playerJoined(ws) {
        ws.id = ID;
        ID++;
        const clients = Array.from(wss.clients);
        console.log(clients.length);
        if(clients.length > 1) {
            for(let i = 0; i < clients.length; i++) {
                const client = clients[i];
                if(client != ws) {
                    ws.matchId = client.id;
                    ws.send("match");
                    console.log("match message sent");
                    return;
                }
            }
        }

    }
    
});
