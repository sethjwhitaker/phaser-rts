import Phaser from 'phaser';

import LobbyConnection from '../websocket';
import PeerConnection from '../peer_connection';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({key: 'title'});
    }

    create() {
        const multiplayerButton = createButton("Find a Match", this);
        const cancelButton = createButton("Cancel", this);
        const input = document.createElement("input");
        input.setAttribute('type', 'text');
        input.setAttribute('id', 'player-name');
        const playerNameMemory = window.localStorage.getItem('playerName');
        if(playerNameMemory) input.value = playerNameMemory;

        const inobj = this.add.dom(1280/2, 720/2-50, input).setInteractive().setOrigin(.5);

        toggleButton(cancelButton);

        multiplayerButton.on('pointerup', () => {
            mpbuttonEventHandler(multiplayerButton, cancelButton, inobj);
        });
        cancelButton.on("pointerup", () => {
            cbEventHandler(cancelButton, multiplayerButton, inobj);
        });
        
        document.body.addEventListener('matchFound', e => {
            console.log("match found event heard");
            if(e.detail.length > 0) {
                PeerConnection.connect(e.detail);
            } else {
                const id = PeerConnection.getId();
                LobbyConnection.waitForMatch(id);
            }
                
        });

        document.body.addEventListener('peerConnection', (e) => {
            console.log("PeerConnection Event Heard");
            LobbyConnection.leaveLobby();
            this.scene.start('chat', {peerConnection: e.detail});
        })
    }
}

function mpbuttonEventHandler(mpb, cb, inp) {
    console.log("multiplayer button pressed");
    const nameEl = document.getElementById("player-name");
    if(nameEl.value.length === 0) {
        nameEl.value = 'name';
    }

    window.localStorage.setItem('playerName', nameEl.value);

    toggleButton(mpb);
    toggleButton(inp);
    toggleButton(cb);

    LobbyConnection.joinLobby(nameEl.value);
}

function cbEventHandler(cb, mpb, inp) {
    console.log("cancel button pressed");
    toggleButton(cb);
    toggleButton(mpb);
    toggleButton(inp);

    LobbyConnection.leaveLobby();
}

function createButton(text, scene) {
    return scene.add.text(
        1280/2, 720/2, text, {
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: {
                x: 10,
                y: 10
            }
        }
    ).setOrigin(.5).setInteractive();
}

function toggleButton(button) {
    if(button.active) {
        button.setActive(false).setVisible(false);
    } else {
        button.setActive(true).setVisible(true);
    }
}
