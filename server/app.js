import express from 'express';
//import http from 'http';
import { Server } from 'ws';
import path from 'path';

const port = process.env.PORT || 3000;
const app = express();
app.use(express.static(path.join(__dirname, '../dist')));
const server = app.listen(port, () => {
    console.log(`Websocket server started on port ` + port);
});
const wss = new Server({ server: server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    setInterval(() => {
        wss.clients.forEach((client) => {
            client.send(new Date().toTimeString());
        });
    }, 1000);

    wss.on('close', () => console.log('Client disconnected'));
});


