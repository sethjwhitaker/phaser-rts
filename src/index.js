import Phaser from 'phaser';
//import Peer from 'peerjs';

import LobbyConnection from './websocket';

const config = {
    type: Phaser.AUTO,
    scale: {
        width: 1280,
        height: 720,
    },
    autoCenter: Phaser.Scale.CENTER_BOTH,
    scene: {
        preload: preload,
        create: create
    }
}

const game = new Phaser.Game(config);
/*const peer = new Peer();
peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);
});*/



function preload () {
    
}

function create() {
    const multiplayerButton = createButton("Find a Match", this);
    const cancelButton = createButton("Cancel", this);
    toggleButton(cancelButton);

    multiplayerButton.on('pointerup', () => {
        mpbuttonEventHandler(multiplayerButton, cancelButton);
    });
    cancelButton.on("pointerup", () => {
        cbEventHandler(cancelButton, multiplayerButton);
    });
    
}

function mpbuttonEventHandler(mpb, cb) {
    console.log("multiplayer button pressed");
    toggleButton(mpb);
    toggleButton(cb);

    LobbyConnection.joinLobby();
}

function cbEventHandler(cb, mpb) {
    console.log("cancel button pressed");
    toggleButton(cb);
    toggleButton(mpb);

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

