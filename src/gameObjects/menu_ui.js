export default class MenuUI {
    constructor(scene) {
        this.scene = scene;
        this.layer = this.scene.add.layer();

        this.hexTitle = null;
        this.upgradeButton = null;
        this.showResearchesButton = null;
        this.researches = null;
    }

    showHexUI(hex) {
        if(!this.hexTitle) {
            this.hexTitle = this.layer.add(this.scene.add.text(
                100, 100,
                `Hex ${hex.id}`,
                {
                    font: "48px Arial",
                    fill: "#ffffff"
                }
            ))
        } else {
            this.hexTitle.setText(`Hex ${hex.id}`);
        }
        
        if(hex.logic.upgradeable) {
            this.upgradeButton = this.layer.add(this.scene.add.text(
                100, 200,
                `Upgrade to Research`,
                {
                    font: "20px Arial",
                    fill: "#ffffff"
                }
            )).setInteractive().on("pointerup", hex.upgradeToResearchHall)
        } 

        if(hex.researchHall.isActive()) {
            this.showResearchesButton = this.layer.add(this.scene.add.text(
                100, 250,
                `Show Researches`,
                {
                    font: `20px Arial`,
                    fill: "#ffffff"
                }
            )).setInteractive().on("pointerup", hex.researchHall.showResearches)
            this.downgradeButton = this.layer.add(this.scene.add.text(
                100, 300,
                `Downgrade`,
                {
                    font: `20px Arial`,
                    fill: "#ffffff"
                }
            )).setInteractive().on("pointerup", hex.downgrade)
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