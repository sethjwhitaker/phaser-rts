import express from 'express';
import { Server } from 'ws';
import path from 'path';

const port = process.env.PORT || 80;
const app = express();
app.use(express.static(path.join(__dirname, '../dist')));
const server = app.listen(port, () => {
    console.log(`Websocket server started on port ` + port);
});
const wss = new Server({ server: server });

wss.on('connection', (ws) => {
    console.log('Client connected' + ws);

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
        }
        
    });

    
});


