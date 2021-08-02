import Phaser from 'phaser';
import LobbyConnection from '../network/websocket';
import PeerConnection, {PeerClient} from '../network/peer_connection';

/** 
 * The landing screen for the game. Handles initiating connections
 * and starting the game.
 * 
 * @author Seth Whitaker
 */
export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({key: 'title'});

        this.matchedPlayers = [];
    }

    /**
     * @inheritdoc
     */
    create() {
        console.log('Title scene started')
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
                console.log(e.detail)
                const data = JSON.parse(e.detail)
                this.matchedPlayers.push(data);
            }
            this.peerClient = new PeerClient();
            
        });

        document.body.addEventListener('peerCreated', e => {
            console.log("peer created event heard")
            console.log(e.detail)
            if(this.matchedPlayers.length > 0 ) {
                if(this.matchedPlayers[0].position == 1)
                    this.peerClient.connect(this.matchedPlayers[0].id);
            } else LobbyConnection.waitForMatch(e.detail);
        })

        document.body.addEventListener('peerConnection', (e) => {
            console.log("PeerConnection Event Heard");
            LobbyConnection.leaveLobby();
            const nameEl = ui.input.node;
            if(nameEl.value.length === 0) {
                nameEl.value = 'name';
            }
            this.scene.start('game', {
                numPlayers: 2, 
                playerName: nameEl.value, 
                otherPlayerData: this.matchedPlayers[0],
                peerConnection: e.detail
            });
        })
    }
}

/**
 * Handles multiplayer button press events
 * 
 * @param {Object} ui The interactive elements of the ui
 */
function mpbuttonEventHandler(ui) {
    console.log("multiplayer button pressed");
    const nameEl = prepareGameStart(ui);

    LobbyConnection.joinLobby(nameEl.value);
}

/**
 * Handles singleplayer button press events
 * 
 * @param {Object} ui The interactive elements of the ui
 * @param {TitleScene} scene The title scene
 */
function spbuttonEventHandler(ui, scene) {
    console.log("singleplayer button pressed");
    const nameEl = prepareGameStart(ui);

    scene.scene.start('game', {numPlayers: 1, playerName: nameEl.value});
}

/**
 * Handles cancel button press events
 * 
 * @param {Object} ui The interactive elements of the ui
 */
function cbEventHandler(ui) {
    console.log("cancel button pressed");
    toggleAll(ui)

    LobbyConnection.leaveLobby();
}

/**
 * Creates an interactive button
 * 
 * @param {String} text The text of the button
 * @param {TitleScene} scene The scene to add this button to
 * @returns {Object} The created Button
 */
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

/**
 * Creates an interactive input element
 * 
 * @param {TitleScene} scene The scene to add this input to
 * @returns {Object} The created Input element
 */
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

/**
 * Switches the display state of all elements in the ui
 * 
 * @param {Object} ui The interactive elements of the ui
 */
function toggleAll(ui) {
    for(const el in ui) {
        toggleUI(ui[el]);
    }
}

/**
 * Switches the display state of an element
 * 
 * @param {Object} element 
 */
function toggleUI(element) {
    if(element.active) {
        element.setActive(false).setVisible(false);
    } else {
        element.setActive(true).setVisible(true);
    }
}

/**
 * Prepares the game for starting
 * 
 * @param {Object} ui The interactive elements of the ui
 * @returns {Object} The input element
 */
function prepareGameStart(ui) {
    const nameEl = ui.input.node;
    console.log(ui)
    if(nameEl.value.length === 0) {
        nameEl.value = 'name';
    }
    window.localStorage.setItem('playerName', nameEl.value);

    toggleAll(ui);

    return nameEl;
}
