export default class ResearchHall {
    constructor(hex) {
        this.hex = hex;

        this.logic = {
            active: false,
            researching: null,
            lastProgressUpdate: 0,
            progress: 0,
            unitResearchMult: 10
        };

        this.maxResearch = 100;
        this.researchBarWidth = 50;
        this.researchBarHeight = 10;

        this.isActive = this.isActive.bind(this);
        this.downgrade = this.downgrade.bind(this);
        this.startResearching = this.startResearching.bind(this);
        this.unlockResearch = this.unlockResearch.bind(this);
        this.showResearches = this.showResearches.bind(this);
    }

    isActive() {
        return this.logic.active;
    }
    setActive(value) {
        this.logic.active = value;
    }

    save() {
        const {...obj} = this.logic;
        return obj;
    }

    load(frame) {
        this.logic = frame;
    }

    downgrade() {
        this.logic.active = false;
        this.logic.researching = null;
        this.logic.lastProgressUpdate = 0;
        this.logic.progress = 0;
        this.hideResearchBar();
    }

    sacrificeUnit(unit) {
        if(this.logic.researching && this.logic.progress < this.maxResearch) {
            this.logic.progress += unit.logic.health*this.logic.unitResearchMult;
            unit.kill();

            if (this.logic.progress - this.logic.lastProgressUpdate >= 10 ||
                this.logic.progress >= this.maxResearch) {
                this.updateResearchBar();
            }
            if(this.logic.progress >= this.maxResearch) {
                this.unlockResearch();
            }
            return true;
        }
        return false;
    }

    startResearching(research) {
        console.log("Start Researching")
        this.logic.researching = research;
        this.showResearchBar();
    }

    unlockResearch() {
        this.logic.researching.obtained = true;
        switch(this.logic.researching.name) {
        case "+hp/+atk":
            console.log("plus hp")
            this.hex.scene.children.getChildren().forEach(child => {
                // If display list child is a unit owned by player
                if(child.constructor.name == "Unit" && child.owned == this.hex.logic.owned) {
                    console.log("found unit")
                    child.logic.attack += 1;
                    child.logic.health += 1;
                }
            })
            break;
        }
        this.logic.researching = null;
    }

    showResearches() {
        this.hex.scene.menuUI.hideHexUI();
        this.hex.scene.menuUI.showResearchMenu(this.hex.logic.owned.researches, this.startResearching);
    }

    showResearchBar() {
        console.log("Showing Research Bar")
        this.researchBarContainer = this.hex.scene.add.rectangle(
            this.hex.x-this.researchBarWidth/2, this.hex.y+this.researchBarHeight/2, 
            this.researchBarWidth, this.researchBarHeight,
            0x000000, 0
        ).setOrigin(0).setStrokeStyle(3, 0x000000, 1).setClosePath(true);
        this.createResearchBar();
        this.hex.scene.uiLayer.add([this.researchBarContainer, this.researchBar])
    }

    createResearchBar() {
        this.researchBar = this.hex.scene.add.rectangle(
            this.hex.x-this.researchBarWidth/2, this.hex.y+this.researchBarHeight/2, 
            this.researchBarWidth*Math.min(this.logic.progress/this.maxResearch, this.maxResearch),
            this.researchBarHeight,
            0x8888ff, 1
        ).setOrigin(0).setStrokeStyle(3, 0x000000, 1).setClosePath(true);
    }

    updateResearchBar() {
        this.logic.lastProgressUpdate = this.logic.progress;
        if(this.researchBar) {
            this.researchBar.destroy();
            this.createResearchBar();
            this.hex.scene.uiLayer.add(this.researchBar)
        } else {
            this.showResearchBar();
        }
    }

    hideResearchBar() {
        if(this.researchBar && this.researchBar.active) {
            this.researchBarContainer.destroy()
            this.researchBar.destroy()
        }
        this.researchBarContainer = null;
        this.researchBar = null;
    }   

    logicUpdate() {
        if(this.logic.researching != null) {
            console.log("Researching my guy")
            this.logic.progress++;
            if (this.logic.progress - this.logic.lastProgressUpdate >= 10 ||
                this.logic.progress >= this.maxResearch) {
                this.updateResearchBar();
            }
            if(this.logic.progress >= this.maxResearch) {
                this.unlockResearch();
            }
        }
    }
}