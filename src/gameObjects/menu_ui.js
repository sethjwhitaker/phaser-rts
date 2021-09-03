export default class MenuUI {
    constructor(scene) {
        this.scene = scene;
        this.layer = this.scene.add.layer();

        this.hexIsShowing = false;
        this.researchesAreShowing = false;

        this.currentHex = null;
        this.hexTitle = null;
        this.upgradeButton = null;
        this.showResearchesButton = null;
        this.researches = null;
        this.researchBackButton = null;

        this.createHexTitle = this.createHexTitle.bind(this);
        this.createHexUpgradeButton = this.createHexUpgradeButton.bind(this);
        this.createHexDowngradeButton = this.createHexDowngradeButton.bind(this);
        this.createShowResearchesButton = this.createShowResearchesButton.bind(this);
        this.showResearchMenu = this.showResearchMenu.bind(this);
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
    createSetRallyPointButton(hex) {
        this.setRallyPointButton = this.layer.add(this.scene.add.text(
            100, 350,
            `Set Rally Point`,
            {
                font: `20px Arial`,
                fill: "#ffffff"
            }
        )).setInteractive().on("pointerup", hex.setRallyPointStart)
    }

    createCancelRallyPointButton(hex) {
        this.cancelRallyPointButton = this.layer.add(this.scene.add.text(
            100, 400,
            `Cancel`,
            {
                font: `20px Arial`,
                fill: "#ffffff"
            }
        )).setInteractive().on("pointerup", hex.cancelSetRallyPoint)
    }

    createRemoveRallyPointButton(hex) {
        this.removeRallyPointButton = this.layer.add(this.scene.add.text(
            100, 450,
            `Remove Rally Point`,
            {
                font: `20px Arial`,
                fill: "#ffffff"
            }
        )).setInteractive().on("pointerup", hex.removeRallyPoint)
    }

    showHexUI(hex) {
        if(this.currentHex !== null) {
            this.updateHexUI(hex)
            return;
        }

        this.createHexTitle(hex)
        
        console.log(hex);

        if(hex.logic.upgradeable) {
            this.createHexUpgradeButton(hex)
        } 

        if(hex.researchHall.isActive()) {
            this.createShowResearchesButton(hex)
            this.createHexDowngradeButton(hex)
        }

        if(hex.logic.owned === this.scene.player && !hex.settingRallyPoint) {
            this.createSetRallyPointButton(hex);
        }

        if(hex.settingRallyPoint) {
            this.createCancelRallyPointButton(hex)
        }

        if(hex.logic.rallyHex) {
            this.createRemoveRallyPointButton(hex)
        }

        this.currentHex = hex;
        this.hexIsShowing = true;
    }

    updateHexUI(hex) {
        if(this.hexTitle) {
            this.hexTitle.setText(`Hex ${hex.id}`);
        } else {
            this.createHexTitle(hex);
        }

        if(this.upgradeButton) {
            if(hex.logic.upgradeable) {
                if(hex !== this.currentHex) {
                    this.upgradeButton.off("pointerup")
                    this.upgradeButton.on("pointerup", hex.upgradeToResearchHall)
                }
            } else {
                this.upgradeButton.destroy();
                this.upgradeButton = null;
            }
        } else {
            if(hex.logic.upgradeable) {
                this.createHexUpgradeButton(hex);
            }
        }

        if(this.downgradeButton) {
            if(hex.researchHall.isActive()) {
                if(hex !== this.currentHex) {
                    this.downgradeButton.off("pointerup")
                    this.downgradeButton.on("pointerup", hex.downgrade)
                }
            } else {
                this.downgradeButton.destroy();
                this.downgradeButton = null;
            }
        } else {
            if(hex.researchHall.isActive()) {
                this.createHexDowngradeButton(hex);
            }
        }

        if(this.showResearchesButton) {
            if(hex.researchHall.isActive()) {
                if(hex !== this.currentHex) {
                    this.showResearchesButton.off("pointerup")
                    this.showResearchesButton.on("pointerup", hex.researchHall.showResearches)
                }
            } else {
                this.showResearchesButton.destroy();
                this.showResearchesButton = null;
            }
        } else {
            if(hex.researchHall.isActive()) {
                this.createShowResearchesButton(hex);
            }
        }

        if(this.setRallyPointButton) {
            if(hex.logic.owned === this.scene.player && !hex.settingRallyPoint) {
                if(hex !== this.currentHex) {
                    this.setRallyPointButton.off("pointerup")
                    this.setRallyPointButton.on("pointerup", hex.setRallyPointStart)
                }
            } else {
                this.setRallyPointButton.destroy();
                this.setRallyPointButton = null;
            }
        } else {
            if(hex.logic.owned === this.scene.player && !hex.settingRallyPoint) {
                this.createSetRallyPointButton(hex);
            }
        }

        if(this.cancelRallyPointButton) {
            if(hex.settingRallyPoint) {
                if(hex !== this.currentHex) {
                    this.cancelRallyPointButton.off("pointerup")
                    this.cancelRallyPointButton.on("pointerup", hex.cancelSetRallyPoint)
                }
            } else {
                this.cancelRallyPointButton.destroy();
                this.cancelRallyPointButton = null;
            }
        } else {
            if(hex.settingRallyPoint) {
                this.createCancelRallyPointButton(hex);
            }
        }

        if(this.removeRallyPointButton) {
            if(hex.logic.rallyHex) {
                if(hex !== this.currentHex) {
                    this.removeRallyPointButton.off("pointerup")
                    this.removeRallyPointButton.on("pointerup", hex.removeRallyPoint)
                }
            } else {
                this.removeRallyPointButton.destroy();
                this.removeRallyPointButton = null;
            }
        } else {
            if(hex.logic.rallyHex) {
                this.createRemoveRallyPointButton(hex);
            }
        }

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

        if(this.setRallyPointButton) {
            this.setRallyPointButton.destroy();
            this.setRallyPointButton = null;
        }

        if(this.cancelRallyPointButton) {
            this.cancelRallyPointButton.destroy();
            this.cancelRallyPointButton = null;
        }

        if(this.removeRallyPointButton) {
            this.removeRallyPointButton.destroy();
            this.removeRallyPointButton = null;
        }

        this.hexIsShowing = false;
    }

    showResearches(researches, callback, x, y) {
        x = x != null ? x : 100;
        y = y != null ? y : 100;
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
                this.showResearches(research.children, callback, x+r.width+20, y)
            }
            y+=r.height;
        })
    }

    showResearchMenu(researches, callback) {

        if(this.hexIsShowing) {
            this.hideHexUI();
        }

        this.showResearches(researches, callback, 100, 100)

        this.researchBackButton = this.layer.add(this.scene.add.text(
            100, 400, "Back", {
                font: "18px Arial",
                fill: "#ffffff"
            }
        )).setInteractive().on("pointerup", () => {
            this.hideResearchMenu()
        })

        this.researchesAreShowing = true;
    }

    hideResearchMenu() {
        if(this.researches) {
            this.researches.forEach(r => {r.destroy()})
            this.researches = null;
        }
        if(this.researchBackButton) {
            this.researchBackButton.destroy()
            this.researchBackButton = null;
        }

        if(this.currentHex !== null) {
            this.showHexUI(this.currentHex)
        }
    }
}