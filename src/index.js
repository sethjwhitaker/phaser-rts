import Phaser from 'phaser';
import TitleScene from './scenes/title';
import GameScene from './scenes/game';
import PlayerComm from './scenes/player_comm';
import ChatBackgroundScene from './scenes/chat/background';
import ChatForegroundScene from './scenes/chat/foreground';
import './styles/main.css';

const titleScene = new TitleScene();
const gameScene = new GameScene();
const playerComm = new PlayerComm();
const chatBackgroundScene = new ChatBackgroundScene();
const chatForegroundScene = new ChatForegroundScene();

const width = window.innerWidth * window.devicePixelRatio;
const height = window.innerHeight * window.devicePixelRatio;

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: width,
        height: height,
    },
    dom: {
        createContainer: true
    },
    input: {
        activePointers: 3
    },
    parent: document.body,
    //autoCenter: Phaser.Scale.CENTER_BOTH,
    disableContextMenu: true
}

const game = new Phaser.Game(config);

game.scene.add('title', titleScene);
game.scene.add('game', gameScene);
game.scene.add('player-comm', playerComm);
game.scene.add('chat-background', chatBackgroundScene);
game.scene.add('chat-foreground', chatForegroundScene);

game.scene.start('title');
