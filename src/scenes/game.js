import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'game'});

        this.lastChange = null;
    }

    create(data) {

        this.peerConnection = data.peerConnection;
        this.scene.launch('chat-background', {peerConnection: this.peerConnection});

        function multiplyMatrices(m1, r1, c1, m2, r2, c2) {
            if(c1 != r2) {
                return m2;
            }
            const newMatrix = [];
            for(var i = 0; i < r1; i++) { // rows of matrix one
                for(var j = 0; j < c2; j++) { // columns of matrix two
                    var value = 0;
                    for(var k = 0; k < c1; k++) {
                        const v1 = m1[i*r1+k];
                        const v2 = m2[j+c2*k];
                        value += v1*v2;
                    }
                    newMatrix.push(value);
                }
            }
            return newMatrix;
        }

        function rotatePoint(point, axis, angle) {
            var rotationMatrix;
            if(axis==="x") {
                rotationMatrix = [
                    1, 0, 0,
                    0, Math.cos(angle), -Math.sin(angle),
                    0, Math.sin(angle), Math.cos(angle)
                ]
            } else if(axis==="y") {
                rotationMatrix = [
                    Math.cos(angle), 0, Math.sin(angle),
                    0, 1, 0,
                    -Math.sin(angle), 0, Math.cos(angle)
                ]
            } else if(axis==="z") {
                rotationMatrix = [
                    Math.cos(angle), -Math.sin(angle), 0,
                    Math.sin(angle), Math.cos(angle), 0, 
                    0, 0, 1
                ]
            }
            return multiplyMatrices(rotationMatrix, 3, 3, point, 3, 1);
        }

        function rotatePoints(points, axis, angle) {
            const newPoints = []
            for(var i = 0; i < points.length; i+=3) {
                const newPoint = rotatePoint(
                    [points[i+0], points[i+1], points[i+2]],
                    axis, angle
                );
                newPoint.forEach(coord => newPoints.push(coord))
            }
            return newPoints;
        }

        function projectPoint(point) {
            const projectionMatrix = [
                1, 0, 0,
                0, 1, 0,
                0, 0, 0
            ]
            return multiplyMatrices(projectionMatrix, 3, 3, point, 3, 1);
        }
         
        function projectPoints(points) {
            const newPoints = []
            for(var i = 0; i < points.length; i+=3) {
                const newPoint = projectPoint([points[i+0], points[i+1], points[i+2]]);
                newPoint.forEach(coord => newPoints.push(coord))
            }
            return newPoints;
        }

        function flattenDimension(points) {
            const newPoints = [];
            for(var i = 0; i < points.length; i++) {
                if((i+1) % 3 !== 0) {
                    newPoints.push(points[i])
                }
            }
            return newPoints;
        }

        function isometric(points) {
            return flattenDimension(
                //projectPoints(
                    rotatePoints(
                        rotatePoints(points, "z", Math.PI/4),
                        "x", Math.asin(Math.PI/6),
                   )
                //)
            )
        }

        const hexPoints = [
            -100, 100*Math.sqrt(3), 0,
            100, 100*Math.sqrt(3), 0, 
            200, 0, 0, 
            100, -100*Math.sqrt(3), 0, 
            -100, -100*Math.sqrt(3), 0,
            -200, 0, 0
        ]

        const squarePoints = [
            -100, 100, 0,
            100, 100, 0,
            100, -100, 0,
            -100, -100, 0
        ]

        this.hex = this.add.polygon(
            this.sys.game.scale.gameSize.width*.75,
            this.sys.game.scale.gameSize.height/2, 
            flattenDimension(hexPoints),
            0xffffff
        ).setOrigin(0).setStrokeStyle(1, 0xff0000, 1);
        this.square = this.add.polygon(
            this.sys.game.scale.gameSize.width/4,
            this.sys.game.scale.gameSize.height/2, 
            isometric(squarePoints),
            0xffffff
        ).setOrigin(0).setStrokeStyle(1, 0xff0000, 1);

        this.welcomeText = this.add.text(
            this.sys.game.scale.gameSize.width/2,
            this.sys.game.scale.gameSize.height/2, 
            "WELCOME TO GAME " + data.playerName.toUpperCase(), {
                color: "#ffffff",
                padding: {
                    x: 10,
                    y: 10
                }
            }
        ).setOrigin(.5);

        const quitButton = this.add.text(
            0,
            this.sys.game.scale.gameSize.height,
            "QUIT", 
            {
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: {
                    x: 10, 
                    y: 10
                }
            }
        ).setOrigin(.5).setInteractive();
        quitButton.x += quitButton.width/2;
        quitButton.y -= quitButton.height/2;
        quitButton.on("pointerup", () => {
            this.qbhandler();
        });

        const chatButton = this.add.text(
            0,
            this.sys.game.scale.gameSize.height,
            "CHAT", 
            {
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: {
                    x: 10, 
                    y: 10
                }
            }
        ).setOrigin(.5).setInteractive();
        chatButton.x += chatButton.width/2;
        chatButton.y -= chatButton.height*1.5;
        chatButton.on("pointerup", () => {
            this.chatButtonHandler();
        });


    }

    update(time, delta) {

        if(this.lastChange > 10) {
            this.lastChange = 0;
            var color = this.welcomeText.style.color;
            var newColor = "#"
            for(var i = 1; i < 7; i+=2) {
                var num = parseInt(color.substr(i, 2), 16);
                const rand = Math.random()
                if(rand>.5) {
                    num = Math.min(255,num+10);
                } else {
                    num = Math.max(0, num-10)
                }
                var newString = num.toString(16);
                if(newString.length < 2) {
                    newString = "0" + newString;
                }
                newColor += newString;
            }

            this.welcomeText.setStyle({
                color: newColor
            })
        } else {
            this.lastChange++;
        }
        
    }

    qbhandler() {
        console.log('quit pressed')
        this.scene.stop('chat');
        this.scene.stop();
        this.scene.start('title');
    }
    chatButtonHandler() {
        this.scene.setVisible(false);
        if(this.scene)
        if(this.scene.isSleeping('chat-foreground')) {
            console.log("woke")
            this.scene.wake('chat-foreground')
        }
        else {
            console.log("not woke")
            this.scene.launch('chat-foreground');
        }

    }
}
