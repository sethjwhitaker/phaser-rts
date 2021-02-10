import Phaser from 'phaser';

import LobbyConnection from '../websocket';
import PeerConnection from '../peer_connection';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({key: 'title'});
    }

    create() {
        const ui = {
            multiplayerButton: createButton("Find a Match", this),
            singleplayerButton: createButton("Single Player", this),
            cancelButton: createButton("Cancel", this),
            input: createInput(this)
        }

        ui.singleplayerButton.y -= ui.singleplayerButton.height+10;

        const playerNameMemory = window.localStorage.getItem('playerName');
        if(playerNameMemory) ui.input.node.value = playerNameMemory;

        toggleUI(ui.cancelButton);

        ui.multiplayerButton.on('pointerup', () => {
            mpbuttonEventHandler(ui);
        });
        ui.singleplayerButton.on('pointerup', () => {
            spbuttonEventHandler(ui, this);
        });
        ui.cancelButton.on("pointerup", () => {
            cbEventHandler(ui);
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

function mpbuttonEventHandler(ui) {
    console.log("multiplayer button pressed");
    const nameEl = ui.input.node;
    if(nameEl.value.length === 0) {
        nameEl.value = 'name';
    }
    window.localStorage.setItem('playerName', nameEl.value);

    toggleAll(ui);

    LobbyConnection.joinLobby(nameEl.value);
}

function spbuttonEventHandler(ui, scene) {
    console.log("multiplayer button pressed");
    const nameEl = ui.input.node;
    if(nameEl.value.length === 0) {
        nameEl.value = 'name';
    }
    window.localStorage.setItem('playerName', nameEl.value);

    toggleAll(ui);

    scene.scene.start('game', {numPlayers: 1, playerName: nameEl.value});
}

function cbEventHandler(ui) {
    console.log("cancel button pressed");
    toggleAll(ui)

    LobbyConnection.leaveLobby();
}

function createButton(text, scene) {
    return scene.add.text(
        scene.sys.game.scale.gameSize.width/2,
        scene.sys.game.scale.gameSize.height/2, 
        text, {
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: {
                x: 10,
                y: 10
            }
        }
    ).setOrigin(.5).setInteractive();
}

function createInput(scene) {
    const input = document.createElement("input");
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'player-name');
    return scene.add.dom(
        scene.sys.game.scale.gameSize.width/2, 
        scene.sys.game.scale.gameSize.height/2+50, 
        input
    ).setInteractive().setOrigin(.5);
}

function toggleAll(ui) {
    for(const el in ui) {
        toggleUI(ui[el]);
    }
}
function toggleUI(element) {
    if(element.active) {
        element.setActive(false).setVisible(false);
    } else {
        element.setActive(true).setVisible(true);
    }
}
