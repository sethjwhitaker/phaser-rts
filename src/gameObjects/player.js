import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Group {
    constructor(scene, options) {
        super(scene)

        this.peerId = options?.peerId
        this.name = options?.name
        this.color = options?.color
        this.isHuman = options?.isHuman

        this.ownedHexes = 0;
        this.ownedUnits = 0;

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
                newColorStr = newColorStr + Math.min(0xf, Math.max(newDigit, 0)).toString(16);
            }

            console.log(newColorStr)
            return parseInt(newColorStr, 16);
        }

        

        /*if(this.selectedHex) {
            if(hex.state.owned === this) {
                hex.setFillStyle(this.color, 1);
            } else {
                this.selectedHex.setFillStyle(0x49ba5f, 1)
            }
        }*/

        if(this.scene.player === this) {
            if(this.selectedHex) {
                this.selectedHex.setFillStyle(this.selectedHex.color, 1)
            }

            hex.setFillStyle(shadeColor(hex.fillColor, -0x5))
        }
        
        this.selectedHex = hex;
    }

    clickSelectedHex() {
        this.selectedHex.tryCapture(this)
    }
}