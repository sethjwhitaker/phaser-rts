import express from 'express';
import { Server } from 'ws';
import path from 'path';
import webpackConfig from '../webpack.dev.js';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

const port = process.env.PORT || 80;
const app = express();
const compiler = webpack(webpackConfig);
app.use(
    webpackDevMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath
    })
);
app.use(express.static(path.join(__dirname, '../dist')));
const server = app.listen(port, () => {
    console.log(`Websocket server started on port ` + port);
});
const wss = new Server({ server: server });


let ID = 0;
wss.on('connection', (ws) => {
    console.log('Client connected');

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

    ws.on('close', () => {
        console.log('Client disconnected')
        if(pingint) clearInterval(pingint);
    });

    ws.missedPongs = 0;
    ws.awaitingPong = false;
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
