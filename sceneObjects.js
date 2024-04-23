/**
 * Camera contains the important info as follows:
 * ---- Eye (camera position)
 * ---- LookAt (where camera is looking at)
 * ---- Up (not affected by Pan or Tilt, only affected by Roll)
 * ---- FOV vertical angle
 * ---- Near and Far values, determining the frustum.
 */
class Camera {
    constructor(sceneData) {
        this.eye = Vector3.fromArray(sceneData.eye);
        this.lookAt = Vector3.fromArray(sceneData.lookat);
        this.up = Vector3.fromArray(sceneData.up);
        this.fovAngleInRad = Tools.toRad(sceneData.fov_angle);

        this.near = sceneData.near;
        this.far = sceneData.far;
    }

    updateEye(x, y, z) {
        this.eye.x = x;
        this.eye.y = y;
        this.eye.z = z;
    }
}

/**
 * A Billboard contains information about:
 * ---- The UL (A), LL (D), UR (B), LR (C) corners
 * ---- Magnitudes and unit vectors for AB and AD
 * ---- Normal vector
 * ---- The image to be shown on the billboard
 */
class Billboard {
    constructor(billboard) {
        if (billboard.filename != null) {
            this.imgFN = billboard.filename;
        }

        this.A = Vector3.fromArray(billboard.UpperLeft);
        this.D = Vector3.fromArray(billboard.LowerLeft);
        this.B = Vector3.fromArray(billboard.UpperRight);

        var vAB = Vector3.minusTwoVectors(this.B, this.A);
        this.vABHat = Vector3.normalizeVector(vAB);
        this.AB = Vector3.getEuclideanNorm(vAB);

        this.C = Vector3.sumTwoVectors(this.D, vAB);

        var vAD = Vector3.minusTwoVectors(this.D, this.A);
        this.vADHat = Vector3.normalizeVector(vAD);
        this.AD = Vector3.getEuclideanNorm(vAD);

        var n = Vector3.crossProduct(vAD, vAB);
        this.nHat = Vector3.normalizeVector(n);

        this.center = new Vector3(
            (this.A.x + this.C.x) / 2,
            (this.A.y + this.C.y) / 2,
            (this.A.z + this.C.z) / 2);

        if (billboard.ambient != null) {
            this.ambientColor = [
                Math.round(billboard.ambient[0] * 255),
                Math.round(billboard.ambient[1] * 255),
                Math.round(billboard.ambient[2] * 255),
                255
            ];
        }
    }

    setImageData(imageData) {
        this.imageData = imageData;
    }

    setProgram(webGLContext) {
        this.program = new BillboardProgram(webGLContext);
        this.program.setBuffers(webGLContext, this);
    }
}

/**
 * SceneImage class stores the data for a .png/.ppm image.
 * 
 * Instead of using the RGBAValues class, which I expect to require a lot of memory and
 * possible reduce performance, this class simply stores pixels as flattened data.
 */
class SceneImage {
    constructor(data, fn, width, height) {
        this.data = data;
        this.fn = fn;
        this.width = width;
        this.height = height;
    }

    static getImageFromPNG(fileData, fn) {
        return new SceneImage(
            // Regular flattened data where RGBA values are in groups of 4. NO RGBAValue INSTANCES.
            fileData.getRGBA8Array(),
            fn,
            fileData.getWidth(),
            fileData.getHeight()
        );
    }
    
    static getImageFromPPM(fileData, fn) {
        // ---------------------------------------- GET METADATA ----------------------------------------
        var width, height;
        var lines = fileData.split(/#[^\n]*\s*|\s+/); // Split text by whitespace or text following '#' ending with whitespace

        var counter = 0;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].length == 0) continue;
            if (counter == 0) {
                // format = lines[i];
            } else if (counter == 1) {
                width = lines[i];
            } else if (counter == 2) {
                height = lines[i];
            } else if (counter == 3) {
                // maxVal = Number(lines[i]);
            } else if (counter > 3) {
                break;
            }
            counter++;
        }

        // ---------------------------------------- GET PIXEL DATA ----------------------------------------
        var w = parseInt(width), h = parseInt(height);
        var flattenedSize = 3 * w * h;
        var dataSize = 4 * w * h;

        var data = new Uint8Array(dataSize);
        var rawData = fileData.substring(fileData.length - flattenedSize); // Raw data must be at the end

        for (var i = 0; i < dataSize; i += 4) {
            let pixelIndex = parseInt(i / 4);
            data[i + 0] = rawData.charCodeAt(pixelIndex * 3 + 0);  // R
            data[i + 1] = rawData.charCodeAt(pixelIndex * 3 + 1);  // G
            data[i + 2] = rawData.charCodeAt(pixelIndex * 3 + 2);  // B
            data[i + 3] = 255;                                     // A
        }

        return new SceneImage(
            data,
            fn,
            w,
            h
        );
    }
}