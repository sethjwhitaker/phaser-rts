export default class MenuUI {
    constructor(scene) {
        this.scene = scene;
        this.layer = this.scene.add.layer();

        this.currentHex = null;
        this.hexTitle = null;
        this.upgradeButton = null;
        this.showResearchesButton = null;
        this.researches = null;

        this.createHexTitle = this.createHexTitle.bind(this);
        this.createHexUpgradeButton = this.createHexUpgradeButton.bind(this);
        this.createHexDowngradeButton = this.createHexDowngradeButton.bind(this);
        this.createShowResearchesButton = this.createShowResearchesButton.bind(this);
        this.updateHexUI = this.updateHexUI.bind(this);
    }

    createHexTitle(hex) {
        this.hexTitle = this.layer.add(this.scene.add.text(
            100, 100,
            `Hex ${hex.id}`,
            {
                font: "48px Arial",
                fill: "#ffffff"
            }
        ))
    }
    createHexUpgradeButton(hex) {
        this.upgradeButton = this.layer.add(this.scene.add.text(
            100, 200,
            `Upgrade to Research`,
            {
                font: "20px Arial",
                fill: "#ffffff"
            }
        )).setInteractive().on("pointerup", hex.upgradeToResearchHall)
    }
    createHexDowngradeButton(hex) {
        this.downgradeButton = this.layer.add(this.scene.add.text(
            100, 300,
            `Downgrade`,
            {
                font: `20px Arial`,
                fill: "#ffffff"
            }
        )).setInteractive().on("pointerup", hex.downgrade)
    }
    createShowResearchesButton(hex) {
        this.showResearchesButton = this.layer.add(this.scene.add.text(
            100, 250,
            `Show Researches`,
            {
                font: `20px Arial`,
                fill: "#ffffff"
            }
        )).setInteractive().on("pointerup", hex.researchHall.showResearches)
    }

    showHexUI(hex) {
        if(this.currentHex !== null) {
            this.updateHexUI(hex)
            return;
        }

        this.createHexTitle(hex)
        
        if(hex.logic.upgradeable) {
            this.createHexUpgradeButton(hex)
        } 

        if(hex.researchHall.isActive()) {
            this.createShowResearchesButton(hex)
            this.createHexDowngradeButton(hex)
        }

        this.currentHex = hex;
    }

    updateSingle(hex, ui, condition, callback, createNew) {
        if(ui) {
            if(condition) {
                if(hex !== this.currentHex) {
                    this.upgradeButton.off("pointerup")
                    this.upgradeButton.on("pointerup", callback)
                }
            } else {
                this.upgradeButton.destroy();
                this.upgradeButton = null;
            }
        } else {
            if(condition) {
                createNew(hex);
            }
        }
    }

    updateHexUI(hex) {
        if(this.hexTitle) {
            this.hexTitle.setText(`Hex ${hex.id}`);
        } else {
            this.createHexTitle(hex);
        }

        this.updateSingle(
            hex, this.upgradeButton, hex.logic.upgradeable,
            hex.upgradeToResearchHall,this.createHexUpgradeButton
        )
        this.updateSingle(
            hex, this.downgradeButton, hex.researchHall.isActive(),
            hex.downgrade, this.createHexDowngradeButton
        )
        this.updateSingle(
            hex, this.showResearchesButton, hex.researchHall.isActive(),
            hex.researchHall.showResearches, this.createShowResearchesButton
        )

        if(hex !== this.currentHex) {
            this.currentHex = hex;
        }
    }

    hideHexUI() {
        if(this.hexTitle) {
            this.hexTitle.destroy();
            this.hexTitle = null;
        }

        if(this.upgradeButton) {
            this.upgradeButton.destroy();
            this.upgradeButton = null;
        }

        if(this.downgradeButton) {
            this.downgradeButton.destroy();
            this.downgradeButton = null;
        }

        if(this.showResearchesButton) {
            this.showResearchesButton.destroy();
            this.showResearchesButton = null;
        }
    }

    showResearchMenu(researches, callback, x, y) {
        var x = x != null ? x : 100;
        var y = y != null ? y : 100;
        if(!this.researches) {
            this.researches = [];
        }
        researches.forEach(research => {
            const r = this.layer.add(this.scene.add.text(
                x, y, research.name, {
                    font: "18px Arial",
                    fill: research.obtained 
                        ? "#00ff00"
                        : "#ffffff"
                }
            ));
            this.researches.push(r);
            if(!research.obtained) {
                r.setInteractive().on("pointerup", () => {callback(research)})
            }
            if(research.children) {
                this.showResearchMenu(research.children, callback, x+r.width+20, y)
            }
            y+=r.height;
        })
    }

    hideResearchMenu() {
        if(this.researches) {
            this.researches.forEach(r => {r.destroy()})
            this.researches = null;
        }
    }
}