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
    const multiplayerButton = this.add.text(
        1280/2, 720/2, "Find a Match", {
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: {
                x: 10,
                y: 10
            }
        }
    ).setOrigin(.5);

    multiplayerButton.setInteractive();
    multiplayerButton.on('pointerup', () => {
        mpbuttonEventHandler(multiplayerButton, this);
    });
}

function mpbuttonEventHandler(gameObject, scene) {
    console.log("multiplayer button pressed");
    gameObject.setActive(false).setVisible(false);
    const cancelButton = scene.add.text(
        1280/2, 720/2, "Cancel", {
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: {
                x: 10,
                y: 10
            }
        }
    ).setOrigin(.5).setInteractive();
    cancelButton.on("pointerup", () => {
        cbEventHandler(cancelButton, scene);
    });

    LobbyConnection.joinLobby();
}

function cbEventHandler(gameObject, scene) {
    console.log("cancel button pressed");
    LobbyConnection.leaveLobby();
}

