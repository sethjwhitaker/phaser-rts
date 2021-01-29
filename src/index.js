import Phaser from 'phaser';
import TitleScene from './scenes/title';
import ChatScene from './scenes/chat';

const titleScene = new TitleScene();
const chatScene = new ChatScene();

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: 1280,
        height: 720,
    },
    dom: {
        createContainer: true
    },
    parent: document.body,
    autoCenter: Phaser.Scale.CENTER_BOTH
}

const game = new Phaser.Game(config);

game.scene.add('title', titleScene);
game.scene.add('chat', chatScene);

game.scene.start('title');
