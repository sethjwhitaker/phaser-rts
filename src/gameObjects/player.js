import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Group {
    static nextPlayerId = 0;
    constructor(scene, options) {
        super(scene)

        this.id = Player.nextPlayerId++;
        this.peerId = options?.peerId
        this.name = options?.name
        this.color = options?.color
        this.isHuman = options?.isHuman

        this.ownedHexes = 0;
        this.ownedUnits = 0;

        this.selected = null;
        this.selectedHex = null;

        this.researches = [
            {
                name: "+hp/+atk",
                obtained: false,
                children: [
                    {
                        name: "r1.1",
                        obtained: false
                    }
                ]
            },
            {
                name: "r2",
                obtained: false
            }
        ]

        this.load = this.load.bind(this);
        this.save = this.save.bind(this)
    }

    load(frame) {
        this.ownedHexes = frame.ownedHexes;
        this.ownedUnits = frame.ownedUnits;
        this.selected = frame.selected ? frame.selected.map(id => {
            return this.scene.children.getChildren().find(child => {
                return child.constructor.name == "Unit" && child.id == id;
            })
        }) : null;
        this.selectedHex = this.scene.map.getHex(frame.selectedHex)
    }

    save() {
        const obj = {
            ownedHexes: this.ownedHexes,
            ownedUnits: this.ownedUnits,
            selected: this.selected ? 
                    this.selected.map(unit => unit.id) : null,
            selectedHex: this.slectedHex ? this.selectedHex.id : null
        }
        return obj
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
        this.scene.menuUI.showHexUI(hex);
    }

    clickSelectedHex() {
        this.selectedHex.tryCapture(this)
    }
}