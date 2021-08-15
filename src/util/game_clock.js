export default class GameClock {
    constructor(offset) { 
        this.offset = offset ? offset : 0;

        this.peerConnection = null;
        this.t0 = null;

        this.numSyncs = 0;
        this.syncResults = [];

        this.time = this.time.bind(this);
        this.toGameTime = this.toGameTime.bind(this);
        this.sync = this.sync.bind(this)
        this.handleSyncResponse = this.handleSyncResponse.bind(this);

        document.body.addEventListener("syncResponse", this.handleSyncResponse);
    }

    // TODO: MAKE SURE to have peerjs use the gameClock for sync instead
    // of raw date

    time() {
        return (new Date()).valueOf() + this.offset;
    }

    toGameTime(time) {
        return time + this.offset;
    }

    sync(peerConnection) {
        this.peerConnection = peerConnection;
        this.t0 = this.time();
        this.peerConnection.sendSyncRequest(this.t0);
        this.numSyncs++;
    }

    handleSyncResponse(e) {
        const t0 = this.t0;
        const t1 = e.detail[0];
        const t2 = e.detail[1];
        const t3 = e.detail[2];
        const theta = ((t1-t0) - (t3-t2))/2
        const delta = (t3-t0) - (t2-t1);
        this.syncResults.push({theta: theta, delta: delta})
        if(this.numSyncs <= 5) this.sync(this.peerConnection);
        else {
            this.calculateOffset();
        }
    }

    calculateOffset() {
        var min = this.syncResults[0];
        var mini = 0;
        var max = this.syncResults[0];
        var maxi = 0;
        for(var i = 1; i < this.syncResults.length; i++) {
            if (this.syncResults[i].theta < min.theta) {
                min = this.syncResults[i];
                mini = i;
            } else if (this.syncResults[i].theta > max.theta) {
                max = this.syncResults[i];
                maxi = i;
            }
        }
        console.log(min, mini, max, maxi);

        // Get an idea of how volatile the connection is
        this.volatility = max.theta-min.theta;

        // Remove outliers
        this.syncResults.splice(mini, 1);
        this.syncResults.splice(maxi, 1);

        var total = 0;
        for(var i = 0; i < this.syncResults.length; i++) {
            total += this.syncResults[i].theta;
        }
        total /= this.syncResults.length;
        total = Math.round(total);

        if(Math.abs(this.offset-total) > 10) {
            this.offset -= Math.floor((this.offset-total)/2);
            console.log("New offset: " + this.offset);
        }

        this.numSyncs = 0;
        this.syncResults.splice(0);
    }
}