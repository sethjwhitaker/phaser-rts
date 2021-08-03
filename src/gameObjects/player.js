import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Group {
    constructor(scene, options) {
        super(scene)

        this.peerId = options?.peerId
        this.name = options?.name
        this.color = options?.color
        this.isHuman = options?.isHuman

        this.ownedHexes = [];
        this.ownedUnits = [];

        this.selected = [];
        this.selectedHex = null;
    }

    selectHex(hex) {
        function shadeColor(color, shade) {
            var colorStr = color.toString(16);

            if(colorStr.length < 6) {
                const length = 6-colorStr.length;
                for(var i = 0; i < length; i++) {
                    colorStr = "0" + colorStr;
                }
            }

            var newColorStr = "";
            for (var i = 0; i < colorStr.length; i++) {
                const newDigit = parseInt(colorStr[i], 16)-shade;
                newColorStr = newColorStr + Math.min(0xf, Math.max(newDigit, 0).toString(16));
            }

            return parseInt(newColorStr, 16);
        }

        if(this.selectedHex) {
            if(hex.state.owned === this) {
                hex.setFillStyle(this.color, 1);
            } else {}
        }

        if(this.scene.player === this) {
            if(hex.state.owned === this) {
                hex.setFillStyle(shadeColor(this.color, -0xa))
            } else if(!hex.state.owned) {
                hex.setFillStyle(0xffffff)
            }
        }
        this.selectedHex = hex;
    }

    clickSelectedHex() {
        this.selectedHex.tryCapture(this)
    }
}