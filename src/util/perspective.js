export default class Perspective {
    constructor() {
        
    }
    /**
     * Calculates the dot product of m1 X m2. 
     * 
     * Note: both matrices must be single dimension arrays. 
     * Their number of rows and columns are specified after 
     * each matrix.
     *  
     * @param {Number[]} m1 The left matrix to multiply.
     * Note: must be a single dimension array.
     * @param {Number} r1 The number of rows in m1.
     * @param {Number} c1 The number of columns in m1.
     * @param {Number[]} m2 The right matrix to multiply.
     * Note: must be a single dimension array.
     * @param {Number} r2 The number of rows in m2.
     * @param {Number} c2 The number of columns in m2.
     * @returns {Number[]} The matrix result of multiplying 
     * m1 and m2.
     */
    static multiplyMatrices(m1, r1, c1, m2, r2, c2) {
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

    /**
     * Rotates a 3d point about the specified axis with origin
     * at (0,0,0).
     * 
     * Note: if a rotation about an axis through a point other than
     * the origin is required, the point should be translated first,
     * then rotated, then untranslated.
     * 
     * @param {Number[]} point The [x, y, z] coordinates of 
     * the point to rotate, relative to the center of 
     * rotation.
     * @param {String} axis The axis of rotation. 
     * One of "x", "y", or "z".
     * @param {Number} angle The angle to rotate in Radians.
     * @returns {Number[]} The rotated point.
     */
    static rotatePoint3d(point, axis, angle) {
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
        return this.multiplyMatrices(rotationMatrix, 3, 3, point, 3, 1);
    }

    static rotatePoints3d(points, axis, angle) {
        const newPoints = []
        for(var i = 0; i < points.length; i+=3) {
            const newPoint = this.rotatePoint3d(
                [points[i+0], points[i+1], points[i+2]],
                axis, angle
            );
            newPoint.forEach(coord => newPoints.push(coord))
        }
        return newPoints;
    }

    static projectPoint3d(point) {
        const projectionMatrix = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 0
        ]
        return this.multiplyMatrices(projectionMatrix, 3, 3, point, 3, 1);
    }
     
    static projectPoints3d(points) {
        const newPoints = []
        for(var i = 0; i < points.length; i+=3) {
            const newPoint = projectPoint([points[i+0], points[i+1], points[i+2]]);
            newPoint.forEach(coord => newPoints.push(coord))
        }
        return newPoints;
    }

    static convertTo2d(points) {
        const newPoints = [];
        for(var i = 0; i < points.length; i++) {
            if((i+1) % 3 !== 0) {
                newPoints.push(points[i])
            }
        }
        return newPoints;
    }

    static convertTo3d(points, z) {
        if(!z) z = 0;

        const newPoints = [];
        for(var i = 0; i < points.length; i++) {
            newPoints.push(points[i]);
            if((i+1) % 2 === 0) {
                newPoints.push(z)
            }
        }
        return newPoints;
    }

    static isometric2d(points) {
        return this.convertTo2d(
            this.isometric3d(
                this.convertTo3d(points)
            )
        )
    }

    static isometric3d(points) {
        points = this.rotatePoints3d(points, "z", Math.PI/4)
        points = this.rotatePoints3d(points, "x", .8)
        return points;
    }
}