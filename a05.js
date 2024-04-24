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

var right_canvas = document.querySelector("#right_canvas");
var rightCtx = right_canvas.getContext("2d", { willReadFrequently: true });
var left_canvas = document.querySelector("#left_canvas");
var leftCtx = left_canvas.getContext("2d", { willReadFrequently: true });
var top_canvas = document.querySelector("#top_canvas");
var topCtx = top_canvas.getContext("2d", { willReadFrequently: true });
var bottom_canvas = document.querySelector("#bottom_canvas");
var bottomCtx = bottom_canvas.getContext("2d", { willReadFrequently: true });
var back_canvas = document.querySelector("#back_canvas");
var backCtx = back_canvas.getContext("2d", { willReadFrequently: true });
var front_canvas = document.querySelector("#front_canvas");
var frontCtx = front_canvas.getContext("2d", { willReadFrequently: true });

var scene;
var allImgs = new Array(0);
var skyboxTextureDatas = [
    { target: webGLContext.TEXTURE_CUBE_MAP_POSITIVE_X, fn: "skybox_right.png", canvas: right_canvas, ctx: rightCtx, imageData: null },
    { target: webGLContext.TEXTURE_CUBE_MAP_NEGATIVE_X, fn: "skybox_left.png", canvas: left_canvas, ctx: leftCtx, imageData: null },
    { target: webGLContext.TEXTURE_CUBE_MAP_POSITIVE_Y, fn: "skybox_top.png", canvas: top_canvas, ctx: topCtx, imageData: null },
    { target: webGLContext.TEXTURE_CUBE_MAP_NEGATIVE_Y, fn: "skybox_bottom.png", canvas: bottom_canvas, ctx: bottomCtx, imageData: null },
    { target: webGLContext.TEXTURE_CUBE_MAP_POSITIVE_Z, fn: "skybox_front.png", canvas: front_canvas, ctx: frontCtx, imageData: null },
    { target: webGLContext.TEXTURE_CUBE_MAP_NEGATIVE_Z, fn: "skybox_back.png", canvas: back_canvas, ctx: backCtx, imageData: null },
];

var isReadyArray;
var isReadyToRender = false;
var hasFinishedProgramming = false;
var prevTimestamp = null;
var elapsedTime = null;

var amplitudeElem = document.getElementById('amplitudeID');
var amplitudeLabelElem = document.getElementById('amplitudeLabelID');
var wavelengthElem = document.getElementById('wavelengthID');
var wavelengthLabelElem = document.getElementById('wavelengthLabelID');
var waterHeightElem = document.getElementById('waterHeightID');
var waterHeightLabelElem = document.getElementById('waterHeightLabelID');
var speedElem = document.getElementById('speedID');
var speedLabelElem = document.getElementById('speedLabelID');
var lightAdjustmentExpElem = document.getElementById('lightAdjustmentExpID');
var lightAdjustmentExpLabelElem = document.getElementById('lightAdjustmentExpLabelID');
var reflectToRefractElem = document.getElementById('reflectToRefractID');
var reflectToRefractLabelElem = document.getElementById('reflectToRefractLabelID');
var toEnableAnimationElem = document.getElementById('toEnableAnimationID');

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

                populateCanvas(img, fileName);
                isReadyArray[i] = true;
            });
        }
    }
}

/**
 * Draw the textures (skybox + picture) onto the texture canvas.
 */
function populateCanvas(img, fileName) {
    var curCanvas = texture_canvas;
    var curCtx = textureCtx;

    var curSkyboxTextureData = null;
    for (var i = 0; i < skyboxTextureDatas.length; i++) {
        var skyboxTextureData = skyboxTextureDatas[i];
        if (fileName == skyboxTextureData.fn) {
            curCanvas = skyboxTextureData.canvas;
            curCtx = skyboxTextureData.ctx;
            curSkyboxTextureData = skyboxTextureData;
            break;
        }
    }

    curCanvas.setAttribute("width", img.width);
    curCanvas.setAttribute("height", img.height);

    let imgData = curCtx.createImageData(img.width, img.height);

    for (var i = 0; i < img.data.length; i += 4) {
        for (var colorChannel = 0; colorChannel < 4; colorChannel++) {
            imgData.data[i + colorChannel] = img.data[i + colorChannel];
        }
    }
    curCtx.putImageData(imgData, curCanvas.width / 2 - img.width / 2, curCanvas.height / 2 - img.height / 2);

    if (curSkyboxTextureData != null) {
        curSkyboxTextureData.imageData = imgData;
    }
}

function initConfigurations() {
    waterHeightElem.value = scene.waterSurface.center.y - scene.billboard.center.y;
    waterHeightLabelElem.innerHTML = waterHeightElem.value;
}

/**
 * Update the configuration values according to the sliders.
 */
function updateConfigurations() {
    amplitudeLabelElem.innerHTML = amplitudeElem.value;
    wavelengthLabelElem.innerHTML = wavelengthElem.value;
    waterHeightLabelElem.innerHTML = waterHeightElem.value;
    speedLabelElem.innerHTML = speedElem.value;
    lightAdjustmentExpLabelElem.innerHTML = lightAdjustmentExpElem.value;
    reflectToRefractLabelElem.innerHTML = reflectToRefractElem.value;
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
    scene.waterSurface.setProgram(webGLContext, scene.billboard, skyboxTextureDatas);
}

/**
 * Render the scene.
 */
function renderAll(curTimestamp) {
    // Clear the canvas to draw the new scene for the current frame.
    webGLContext.clearColor(scene.defaultColor.x, scene.defaultColor.y, scene.defaultColor.z, 1.0);
    webGLContext.clear(webGLContext.COLOR_BUFFER_BIT | webGLContext.DEPTH_BUFFER_BIT);
    webGLContext.viewport(0, 0, webGLContext.canvas.width, webGLContext.canvas.height);
    webglUtils.resizeCanvasToDisplaySize(webGLContext.canvas);

    if (toEnableAnimationElem.checked) {
        if (elapsedTime == null) {
            elapsedTime = 0;
        }
        else {
            elapsedTime += (curTimestamp - prevTimestamp) / 1000;
        }
        
    }
    prevTimestamp = curTimestamp;

    renderWaterSurface();
}

/**
 * Render the surface of the water
 */
function renderWaterSurface() {
    webGLContext.enable(webGLContext.CULL_FACE);
    webGLContext.enable(webGLContext.DEPTH_TEST);

    var waterHeight = Number(waterHeightElem.value);
    var positions = new Float32Array([
        // Triangle 1
        scene.waterSurface.A.x, scene.billboard.center.y + waterHeight, scene.waterSurface.A.z,
        scene.waterSurface.D.x, scene.billboard.center.y + waterHeight, scene.waterSurface.D.z,
        scene.waterSurface.B.x, scene.billboard.center.y + waterHeight, scene.waterSurface.B.z,
        // Triangle 2
        scene.waterSurface.B.x, scene.billboard.center.y + waterHeight, scene.waterSurface.B.z,
        scene.waterSurface.D.x, scene.billboard.center.y + waterHeight, scene.waterSurface.D.z,
        scene.waterSurface.C.x, scene.billboard.center.y + waterHeight, scene.waterSurface.C.z
    ]);
    scene.waterSurface.program.setPositionBuffer(webGLContext, positions);

    webGLContext.useProgram(scene.waterSurface.program.program);
    scene.waterSurface.program.sendBufferData(webGLContext);

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
    webGLContext.uniform1i(scene.waterSurface.program.u_texture, 0);
    // SKYBOX
    webGLContext.uniform1i(scene.waterSurface.program.u_skybox, 1);

    // CENTER
    webGLContext.uniform3fv(
        scene.waterSurface.program.u_center,
        new Float32Array([scene.waterSurface.center.x, scene.billboard.center.y + waterHeight, scene.waterSurface.center.z]));
    // X MAX
    webGLContext.uniform1f(scene.waterSurface.program.u_xMax, scene.billboard.B.x);
    // DEFAULT COLOR
    webGLContext.uniform4fv(
        scene.waterSurface.program.u_defaultColor,
        new Float32Array([scene.defaultColor.x, scene.defaultColor.y, scene.defaultColor.z, 1]));
    // REFLECTED TO REFRACTED
    webGLContext.uniform1f(scene.waterSurface.program.u_reflectToRefract, Number(reflectToRefractElem.value));

    // N AIR
    webGLContext.uniform1f(scene.waterSurface.program.u_nAir, 1);
    // N WATER
    webGLContext.uniform1f(scene.waterSurface.program.u_nWater, 2);

    // AMPLITUDE
    webGLContext.uniform1f(scene.waterSurface.program.u_amplitude, Number(amplitudeElem.value));
    // SPEED
    webGLContext.uniform1f(scene.waterSurface.program.u_speed, Number(speedElem.value));
    // TIME
    webGLContext.uniform1f(scene.waterSurface.program.u_time, elapsedTime);
    // WAVELENGTH
    webGLContext.uniform1f(scene.waterSurface.program.u_wavelength, Number(wavelengthElem.value));
    // WATER HEIGHT
    webGLContext.uniform1f(scene.waterSurface.program.u_waterHeight, waterHeight);
    // LIGHT ADJUSTMENT EXPONENT
    webGLContext.uniform1f(scene.waterSurface.program.u_lightAdjustmentExp, Number(lightAdjustmentExpElem.value));

    // WORLD VIEW PROJECTION
    webGLContext.uniformMatrix4fv(scene.waterSurface.program.u_objToClipMatrix, false, objToClipMatrix);

    webGLContext.drawArrays(webGLContext.TRIANGLES, 0, 6);
}