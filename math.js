/**
 * Vector3 class supports basic operations for 3D vector space.
 * 
 * The orthonormal basis satisfies:
 * xHat x yHat = zHat
 * 
 * Useful operations such as 1D and 2D projections are also included.
 */
class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static fromArray = (arr) => {
        return new Vector3(arr[0], arr[1], arr[2]);
    }

    static _xHat = new Vector3(1, 0, 0);
    static get xHat() {
        return this._xHat;
    }

    static _yHat = new Vector3(0, 1, 0);
    static get yHat() {
        return this._yHat;
    }

    static _zHat = new Vector3(0, 0, 1);
    static get zHat() {
        return this._zHat;
    }

    static multiplyVectorScalar(v, c) {
        return new Vector3(v.x * c, v.y * c, v.z * c);
    }

    static sumTwoVectors(v1, v2) {
        return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    static minusTwoVectors(v1, v2) {
        return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    static getEuclideanNorm(v) {
        return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2) + Math.pow(v.z, 2));
    }

    static normalizeVector(v) {
        let vNorm = this.getEuclideanNorm(v);
        return new Vector3(v.x / vNorm, v.y / vNorm, v.z / vNorm);
    }

    static crossProduct(v1, v2) {
        return new Vector3(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    }

    static negate(v) {
        return new Vector3(-v.x, -v.y, -v.z);
    }

    static dotProduct(v1, v2) {
        var result = 0;
        result += v1.x * v2.x;
        result += v1.y * v2.y;
        result += v1.z * v2.z;
        return result;
    }

    static distance(v1, v2) {
        return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2) + Math.pow(v1.z - v2.z, 2));
    }

    /**
     * Compute the absolute angle (in radians) between two vectors.
     * Resulting range = [0, pi].
     */
    static getAngleInRad(v1, v2) {
        var v1Norm = this.getEuclideanNorm(v1);
        var v2Norm = this.getEuclideanNorm(v2);

        if (v1Norm == 0 || v2Norm == 0) {
            // Default to 0 degree if either of the vectors is the zero-vector.
            return 0;
        }

        return Math.acos(Vector3.dotProduct(v1, v2) / (v1Norm * v2Norm));
    }

    /**
     * Returns the projection of vToProject onto
     * the 1D vector space span{targetV}.
     * 
     * ASSUME that |targetV| = 1.
     */
    static project1D(vToProject, targetV) {
        return this.multiplyVectorScalar(
            targetV,
            this.dotProduct(vToProject, targetV)
        );
    }

    /**
     * Returns the projection of vToProject onto
     * the (at most) 2D vector space span{targetV1, targetV2}
     * 
     * ASSUME that |targetV1| = |targetV2| = 1.
     */
    static project2D(vToProject, targetV1, targetV2) {
        var angle = this.getAngleInRad(targetV1, targetV2);
        if (angle == 0) {
            // The target vector space collapses down to 1D.
            return project1D(vToProject, targetV1);
        }

        var orthonormalBasis = [targetV1, targetV2];
        if (angle != Tools.toRad(90)) {
            orthogonalBasis = this.getOrthonormalBasis(targetV1, targetV2);
        }

        var v1 = project1D(vToProject, orthonormalBasis[0]);
        var v2 = project1D(vToProject, orthonormalBasis[1]);
        return this.sumTwoVectors(v1, v2);
    }

    /**
     * Given A = {v1, v2}, returns the orthonormal basis, B = {w1, w2}
     * such that span(A) = span(B).
     * 
     * ASSUME that A is linearly independent and |v1| = |v2| = 1.
     */
    static getOrthonormalBasis(v1, v2) {
        let v3 = this.dotProduct(v1, v2);
        return [v1, this.dotProduct(v3, v1)];
    }
}

/**
 * This class contains useful functions for the project.
 */
class Tools {
    /**
     * Converts from degrees into radians.
     */
    static toRad(deg) {
        return deg / 180 * Math.PI;
    }

    /**
     * Converts from radians into degrees.
     */
    static toDeg(rad) {
        return rad / Math.PI * 180;
    }

    /**
     * Computes the cosine given an input in degrees.
     */
    static cosd(deg) {
        return Math.cos(Tools.toRad(deg));
    }

    /**
     * Computes the cosine given an input in radians.
     */
    static sind(deg) {
        return Math.sin(Tools.toRad(deg));
    }

    /**
     * Computes the rotation matrix about the x-axis in homogeneous coords.
     * Input angle is given is degrees.
     */
    static getHomogeneousXRotationMatrix(thetaInDeg) {
        var result = m4.identity();
        result[4 * 1 + 1] = Tools.cosd(thetaInDeg);
        result[4 * 1 + 2] = Tools.sind(thetaInDeg);
        result[4 * 2 + 1] = -Tools.sind(thetaInDeg);
        result[4 * 2 + 2] = Tools.cosd(thetaInDeg);
        return result;
    }

    /**
     * Computes the rotation matrix about the y-axis in homogeneous coords.
     * Input angle is given is degrees.
     */
    static getHomogeneousYRotationMatrix(thetaInDeg) {
        var result = m4.identity();
        result[4 * 0 + 0] = Tools.cosd(thetaInDeg);
        result[4 * 0 + 2] = Tools.sind(thetaInDeg);
        result[4 * 2 + 0] = -Tools.sind(thetaInDeg);
        result[4 * 2 + 2] = Tools.cosd(thetaInDeg);
        return result;
    }

    /**
     * Computes the rotation matrix about the z-axis in homogeneous coords.
     * Input angle is given is degrees.
     */
    static getHomogeneousZRotationMatrix(thetaInDeg) {
        var result = m4.identity();
        result[4 * 0 + 0] = Tools.cosd(thetaInDeg);
        result[4 * 0 + 1] = Tools.sind(thetaInDeg);
        result[4 * 1 + 0] = -Tools.sind(thetaInDeg);
        result[4 * 1 + 1] = Tools.cosd(thetaInDeg);
        return result;
    }

    /**
     * Linearly interpolate the colors vertically, then horizontally.
     */
    static getLinearlyInterpolatedColor(img, x, y, colorChannel) {
        var newX = Math.floor(x), newY = Math.floor(y);
        if (newX == (img.width - 1)) newX--;
        if (newY == (img.height - 1)) newY--;

        var nwColor = img.data[(newY * img.width + newX) * 4 + colorChannel];
        var swColor = img.data[((newY + 1) * img.width + newX) * 4 + colorChannel];
        var wColor = nwColor + (swColor - nwColor) * (y - newY);

        var neColor = img.data[(newY * img.width + newX + 1) * 4 + colorChannel];
        var seColor = img.data[((newY + 1) * img.width + newX + 1) * 4 + colorChannel];
        var eColor = neColor + (seColor - neColor) * (y - newY);

        return wColor + (eColor - wColor) * (x - newX);
    }

    /**
     * Compute the reflection ray given the incident ray, l (from eye to hitpoint)
     * and the surface normal. The formula is:
     * 
     * r = l - 2(n.l)n
     * 
     * ASSUME that |l| = |n| = 1.
     */
    static getReflectionRayDir(l, n) {
        var nl = Vector3.dotProduct(l, n);
        return new Vector3(
            l.x - 2 * nl * n.x,
            l.y - 2 * nl * n.y,
            l.z - 2 * nl * n.z
        );
    }

    /**
     * Clamp all color channels to be within [0, 255]
     */
    static clampColor(color) {
        var result = new Array(color.length);
        for (var i = 0; i < color.length; i++) {
            result[i] = Tools.clampColorChannel(color[i]);
        }
        return result;
    }

    /**
     * Clamp the give value to be within [0, 255]
     */
    static clampColorChannel(val) {
        if (val < 0) {
            return 0;
        }
        if (255 < val) {
            return 255;
        }
        return val;
    }

    /**
     * To account for rounding errors, we also need a slight offset:
     * hitpoint = eye + tv
     * hitpointWithOffset = hitpoint + epsilon * n
     */
    static getHitpointWithOffset(v, eye, t, n) {
        return new Vector3(
            eye.x + t * v.x + Scene.Epsilon * n.x,
            eye.y + t * v.y + Scene.Epsilon * n.y,
            eye.z + t * v.z + Scene.Epsilon * n.z
        );
    }
}