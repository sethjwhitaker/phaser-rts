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
        if(this.selectedHex !== hex) {
            if(this.selectedHex)
                this.selectedHex.deselect();
            hex.select();
        }

        this.selectedHex = hex;
        this.scene.menuUI.showHexUI(hex);
    }

    clickSelectedHex() {
        this.selectedHex.tryCapture(this)
    }
}