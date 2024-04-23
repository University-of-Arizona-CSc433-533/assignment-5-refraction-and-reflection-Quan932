/*
 This file is a template for a05 CS433/533
 
 Author: Amir Mohammad Esmaieeli Sikaroudi
 Email: amesmaieeli@email.arizona.edu
 Date: April, 2022
 
 Sources uses for this template:
 First Obj parser:
 https://webglfundamentals.org/
 The library for decoding PNG files is from:
 https://github.com/arian/pngjs

Primary Author: Quan Le
Date: April 21, 2024
*/

var input = document.getElementById("load_scene");
var texture_canvas = document.querySelector("#texture_canvas");
var textureCtx = texture_canvas.getContext("2d", { willReadFrequently: true });

var rendering_canvas = document.querySelector("#rendering_canvas");
var webGLContext = rendering_canvas.getContext("webgl", { preserveDrawingBuffer: true });

var scene;
var allImgs = new Array(0);

var isReadyArray;
var isReadyToRender = false;
var hasFinishedProgramming = false;

var amplitudeElem = document.getElementById('amplitudeID');
var amplitudeLabelElem = document.getElementById('amplitudeLabelID');
var wavelengthElem = document.getElementById('wavelengthID');
var wavelengthLabelElem = document.getElementById('wavelengthLabelID');
var waterHeightElem = document.getElementById('waterHeightID');
var waterHeightLabelElem = document.getElementById('waterHeightLabelID');
var speedElem = document.getElementById('speedID');
var speedLabelElem = document.getElementById('speedLabelID');

// Call the rendering loop immediately to update the sliders even when no files are uploaded.
setTimeout(function () { requestAnimationFrame(renderingLoop) }, 10);

function upload() {
    if (input.files.length > 0) {
        if (isReadyToRender) // New scene uploaded.
        {
            allImgs = new Array(0);
            isReadyToRender = false;
            hasFinishedProgramming = false;
        }
        isReadyArray = new Array(input.files.length);
        for (var i = 0; i < input.files.length; i++) {
            isReadyArray[i] = false;
            var file = input.files[i];
            var reader = new FileReader();
            reader.onload = createReaderOnLoadHandler(file, i); // Assign OnLoad handler
            let fileName = file.name;
            let fileExtension = fileName.split('.').pop();
            if (fileExtension == 'ppm' || fileExtension == 'json' || fileExtension == 'obj') {
                reader.readAsBinaryString(file);
            } else if (fileExtension == 'png') {
                reader.readAsArrayBuffer(file);
            }
        }
    }
}
input.addEventListener("change", upload);

function createReaderOnLoadHandler(file, i) {
    return function () {
        let fileName = file.name;
        let fileExtension = fileName.split('.').pop();

        if (fileExtension == 'json') {
            var sceneDataJSON = this.result;
            scene = new Scene(sceneDataJSON); // Init Scene

            initConfigurations();
            updateConfigurations();

            isReadyArray[i] = true;
        } else if (fileExtension == 'ppm') {
            var fileData = this.result;
            let img = SceneImage.getImageFromPPM(fileData, fileName); // Init PPM image
            allImgs.push(img);

            populateTextureCanvas(img);

            isReadyArray[i] = true;
        } else if (fileExtension == 'png') {
            var fileData = this.result;
            var pngImage = new PNGReader(fileData);
            pngImage.parse(function (err, png) {
                if (err) throw err;
                let img = SceneImage.getImageFromPNG(png, fileName); // Init PNG image
                allImgs.push(img);

                populateTextureCanvas(img);
                isReadyArray[i] = true;
            });
        }
    }
}

/**
 * Draw the texture image onto the texture canvas.
 */
function populateTextureCanvas(img) {
    texture_canvas.setAttribute("width", img.width);
    texture_canvas.setAttribute("height", img.height);

    let imgData = textureCtx.createImageData(img.width, img.height);

    for (var i = 0; i < img.data.length; i += 4) {
        for (var colorChannel = 0; colorChannel < 4; colorChannel++) {
            imgData.data[i + colorChannel] = img.data[i + colorChannel];
        }
    }
    textureCtx.putImageData(imgData, texture_canvas.width / 2 - img.width / 2, texture_canvas.height / 2 - img.height / 2);
}

/**
 * Set up the sliders to match the values specified in the Scene JSON file.
 */
function initConfigurations() {
    // camXElem.value = scene.ogCam.eye.x;
    // camYElem.value = scene.ogCam.eye.y;
    // camZElem.value = scene.ogCam.eye.z;
    // 
    // objXElem.value = scene.objModel.position.x;
    // objYElem.value = scene.objModel.position.y;
    // objZElem.value = scene.objModel.position.z;
    // 
    // xRotSpeedElem.value = 0;
    // yRotSpeedElem.value = 90;
    // zRotSpeedElem.value = 0;
}

/**
 * Update the configuration values according to the sliders.
 */
function updateConfigurations() {
    amplitudeLabelElem.innerHTML = amplitudeElem.value;
    wavelengthLabelElem.innerHTML = wavelengthElem.value;
    waterHeightLabelElem.innerHTML = waterHeightElem.value;
    speedLabelElem.innerHTML = speedElem.value;
    // phongExpLabelElem.innerHTML = phongExpElem.value;
    // objXLabelElem.innerHTML = objXElem.value;
    // objYLabelElem.innerHTML = objYElem.value;
    // objZLabelElem.innerHTML = objZElem.value;
    // xRotSpeedLabelElem.innerHTML = xRotSpeedElem.value;
    // yRotSpeedLabelElem.innerHTML = yRotSpeedElem.value;
    // zRotSpeedLabelElem.innerHTML = zRotSpeedElem.value;
}

/**
 * The main rendering loop. The :curTimestamp: variable helps with the animation.
 */
function renderingLoop(curTimestamp) {
    updateConfigurations();

    if (isReadyArray == null) {
        setTimeout(function () { requestAnimationFrame(renderingLoop) }, 10);
        return;
    }

    if (!isReadyToRender) {
        isReadyToRender = true;
        for (let i = 0; i < isReadyArray.length; i++) {
            isReadyToRender &= isReadyArray[i];
        }
    }

    if (!isReadyToRender) {
        // Keep on waiting for the files to be processed.
        setTimeout(function () { requestAnimationFrame(renderingLoop) }, 10);
        return;
    }

    if (!hasFinishedProgramming) {
        programAll();

        // Support for Alpha
        webGLContext.enable(webGLContext.BLEND)
        webGLContext.colorMask(true, true, true, true);
        webGLContext.blendFunc(webGLContext.SRC_ALPHA, webGLContext.ONE_MINUS_SRC_ALPHA);

        hasFinishedProgramming = true;
    } else {
        renderAll(curTimestamp);
    }

    // Call renderingLoop with delay to give user a chance to interact with the GUI
    setTimeout(function () { requestAnimationFrame(renderingLoop) }, 10);
}

/**
 * Create the programs for Billboard.
 */
function programAll() {
    scene.billboard.setImageData(textureCtx.getImageData(0, 0, texture_canvas.width, texture_canvas.height));
    scene.billboard.setProgram(webGLContext);
}

/**
 * Render the scene.
 */
function renderAll(curTimestamp) {
    // scene.ogCam.updateEye(Number(camXElem.value), Number(camYElem.value), Number(camZElem.value));

    // Clear the canvas to draw the new scene for the current frame.
    webGLContext.clearColor(scene.defaultColor.x, scene.defaultColor.y, scene.defaultColor.z, 1.0);
    webGLContext.clear(webGLContext.COLOR_BUFFER_BIT | webGLContext.DEPTH_BUFFER_BIT);
    webGLContext.viewport(0, 0, webGLContext.canvas.width, webGLContext.canvas.height);
    webglUtils.resizeCanvasToDisplaySize(webGLContext.canvas);

    renderBillboard(curTimestamp);
}

var test = 0;
/**
 * Render the Billboard, which simply shows the texture.
 * No shading is done on the Billboard.
 * The :toFlip: argument helps with rendering the mirrored view during 1st pass.
 */
function renderBillboard(curTimestamp) {
    webGLContext.enable(webGLContext.CULL_FACE);
    webGLContext.enable(webGLContext.DEPTH_TEST);

    var waterHeight = Number(waterHeightElem.value);
    var positions = new Float32Array([
        // Triangle 1
        scene.billboard.A.x, scene.billboard.A.y + waterHeight, scene.billboard.A.z,
        scene.billboard.D.x, scene.billboard.D.y + waterHeight, scene.billboard.D.z,
        scene.billboard.B.x, scene.billboard.B.y + waterHeight, scene.billboard.B.z,
        // Triangle 2
        scene.billboard.B.x, scene.billboard.B.y + waterHeight, scene.billboard.B.z,
        scene.billboard.D.x, scene.billboard.D.y + waterHeight, scene.billboard.D.z,
        scene.billboard.C.x, scene.billboard.C.y + waterHeight, scene.billboard.C.z
    ]);
    scene.billboard.program.setPositionBuffer(webGLContext, positions);

    webGLContext.useProgram(scene.billboard.program.program);
    scene.billboard.program.sendBufferData(webGLContext);

    // CAMERA MATRIX: Cam-coords -> World-coords
    var cameraMatrix = m4.lookAt(
        [scene.cam.eye.x, scene.cam.eye.y, scene.cam.eye.z],
        [scene.cam.lookAt.x, scene.cam.lookAt.y, scene.cam.lookAt.z],
        [scene.cam.up.x, scene.cam.up.y, scene.cam.up.z]);
    // VIEW MATRIX: World-coords -> Cam-coords
    var viewMatrix = m4.inverse(cameraMatrix);
    // PROJECTION MATRIX: Cam-coords -> Clip-coords
    var aspect = webGLContext.canvas.clientWidth / webGLContext.canvas.clientHeight;
    var projectionMatrix = m4.perspective(scene.cam.fovAngleInRad, aspect, scene.cam.near, scene.cam.far);
    // COMPOSITION
    var objToClipMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // TEXTURE
    var texture = webGLContext.createTexture();
    webGLContext.activeTexture(webGLContext.TEXTURE0);
    webGLContext.bindTexture(webGLContext.TEXTURE_2D, texture);
    webGLContext.texImage2D(
        webGLContext.TEXTURE_2D, 0, webGLContext.RGBA, webGLContext.RGBA, webGLContext.UNSIGNED_BYTE,
        scene.billboard.imageData);
    webGLContext.generateMipmap(webGLContext.TEXTURE_2D); // Only applies to 2^n x 2^n textures.
    webGLContext.uniform1i(scene.billboard.program.u_texture, 0);

    // CENTER
    webGLContext.uniform3fv(
        scene.billboard.program.u_center,
        new Float32Array([scene.billboard.center.x, scene.billboard.center.y + waterHeight, scene.billboard.center.z]));
    // X MAX
    webGLContext.uniform1f(scene.billboard.program.u_xMax, scene.billboard.B.x);
    // DEFAULT COLOR
    webGLContext.uniform4fv(
        scene.billboard.program.u_defaultColor,
        new Float32Array([scene.defaultColor.x, scene.defaultColor.y, scene.defaultColor.z, 1]));

    // N AIR
    webGLContext.uniform1f(scene.billboard.program.u_nAir, 1);
    // N WATER
    webGLContext.uniform1f(scene.billboard.program.u_nWater, 2);

    // AMPLITUDE
    webGLContext.uniform1f(scene.billboard.program.u_amplitude, Number(amplitudeElem.value));
    // SPEED
    webGLContext.uniform1f(scene.billboard.program.u_speed, Number(speedElem.value));
    // TIME
    webGLContext.uniform1f(scene.billboard.program.u_time, curTimestamp / 1000);
    // WAVELENGTH
    webGLContext.uniform1f(scene.billboard.program.u_wavelength, Number(wavelengthElem.value));
    // WATER HEIGHT
    webGLContext.uniform1f(scene.billboard.program.u_waterHeight, waterHeight);

    // WORLD VIEW PROJECTION
    webGLContext.uniformMatrix4fv(scene.billboard.program.u_objToClipMatrix, false, objToClipMatrix);

    webGLContext.drawArrays(webGLContext.TRIANGLES, 0, 6);
}