/**
 * The program for the Billboard
 */
class BillboardProgram {
    constructor(webGLContext) {
        this.program = webglUtils.createProgramFromSources(
            webGLContext, [BillboardProgram.VertexShaderCode, BillboardProgram.FragmentShaderCode]);

        this.getAttribLocations(webGLContext);
        this.getUniformLocations(webGLContext);
    }

    setTextures(webGLContext, billboard, skyboxTextureDatas) {
        // TEXTURE
        var texture = webGLContext.createTexture();
        webGLContext.activeTexture(webGLContext.TEXTURE0);
        webGLContext.bindTexture(webGLContext.TEXTURE_2D, texture);
        webGLContext.texImage2D(
            webGLContext.TEXTURE_2D, 0, webGLContext.RGBA, webGLContext.RGBA, webGLContext.UNSIGNED_BYTE,
            billboard.imageData);
        webGLContext.generateMipmap(webGLContext.TEXTURE_2D); // Only applies to 2^n x 2^n textures.

        // SKYBOX
        var skyboxTexture = webGLContext.createTexture();
        webGLContext.activeTexture(webGLContext.TEXTURE1);
        webGLContext.bindTexture(webGLContext.TEXTURE_CUBE_MAP, skyboxTexture);
        for (var i = 0; i < skyboxTextureDatas.length; i++) {
            var skyboxTextureData = skyboxTextureDatas[i];
            webGLContext.texImage2D(skyboxTextureData.target, 0, webGLContext.RGBA, webGLContext.RGBA, webGLContext.UNSIGNED_BYTE,
                skyboxTextureData.imageData);
        }
        webGLContext.generateMipmap(webGLContext.TEXTURE_CUBE_MAP); // Only applies to 2^n x 2^n textures.
        webGLContext.texParameteri(webGLContext.TEXTURE_CUBE_MAP, webGLContext.TEXTURE_MIN_FILTER, webGLContext.LINEAR_MIPMAP_LINEAR);
    }

    setPositionBuffer(webGLContext, positions) {
        this.b_position = webGLContext.createBuffer();
        webGLContext.bindBuffer(webGLContext.ARRAY_BUFFER, this.b_position);
        webGLContext.bufferData(webGLContext.ARRAY_BUFFER, positions, webGLContext.STATIC_DRAW);
    }

    sendBufferData(webGLContext) {
        webGLContext.enableVertexAttribArray(this.a_position);
        webGLContext.bindBuffer(webGLContext.ARRAY_BUFFER, this.b_position);
        webGLContext.vertexAttribPointer(this.b_position, 3, webGLContext.FLOAT, false, 0, 0);
    }

    getAttribLocations(webGLContext) {
        this.a_position = webGLContext.getAttribLocation(this.program, "a_position");
    }

    getUniformLocations(webGLContext) {
        this.u_skybox = webGLContext.getUniformLocation(this.program, "u_skybox");
        this.u_texture = webGLContext.getUniformLocation(this.program, "u_texture");
        this.u_center = webGLContext.getUniformLocation(this.program, "u_center");
        this.u_xMax = webGLContext.getUniformLocation(this.program, "u_xMax");
        this.u_defaultColor = webGLContext.getUniformLocation(this.program, "u_defaultColor");
        this.u_reflectToRefract = webGLContext.getUniformLocation(this.program, "u_reflectToRefract");

        this.u_nAir = webGLContext.getUniformLocation(this.program, "u_nAir");
        this.u_nWater = webGLContext.getUniformLocation(this.program, "u_nWater");

        this.u_amplitude = webGLContext.getUniformLocation(this.program, "u_amplitude");
        this.u_speed = webGLContext.getUniformLocation(this.program, "u_speed");
        this.u_time = webGLContext.getUniformLocation(this.program, "u_time");
        this.u_wavelength = webGLContext.getUniformLocation(this.program, "u_wavelength");
        this.u_waterHeight = webGLContext.getUniformLocation(this.program, "u_waterHeight");
        this.u_lightAdjustmentExp = webGLContext.getUniformLocation(this.program, "u_lightAdjustmentExp");

        this.u_objToClipMatrix = webGLContext.getUniformLocation(this.program, "u_objToClipMatrix");
    }

    static get VertexShaderCode() {
        return "" +
            "precision mediump float;" +

            "attribute vec3 a_position;" +

            "varying vec3 v_position;" +

            "uniform mat4 u_objToClipMatrix;" +

            "void main() {" +
            "   gl_Position = u_objToClipMatrix * vec4(a_position, 1.0);" +
            "   v_position = a_position;" +
            "}";
    }

    static get FragmentShaderCode() {
        return "" +
            "precision mediump float;" +

            "const float PI = 3.1415926535897932384626433832795;" +

            "varying vec3 v_position;" +

            "uniform samplerCube u_skybox;" +
            "uniform sampler2D u_texture;" +
            "uniform vec3 u_center;" +
            "uniform float u_xMax;" +
            "uniform vec4 u_defaultColor;" +
            "uniform float u_reflectToRefract;" +

            "uniform float u_nAir;" +
            "uniform float u_nWater;" +

            "uniform float u_amplitude;" +
            "uniform float u_speed;" +
            "uniform float u_time;" +
            "uniform float u_wavelength;" +
            "uniform float u_waterHeight;" +
            "uniform float u_lightAdjustmentExp;" +

            "vec2 rotate2D(vec2 v) {" +
            "   float rho = length(v_position - u_center);" +
            "   float sinPhi = v_position.z / rho;" +
            "   float cosPhi = v_position.x / rho;" +
            "   vec2 col1 = vec2(cosPhi, sinPhi);" +
            "   vec2 col2 = vec2(-sinPhi, cosPhi);" +
            "   mat2 R = mat2(col1, col2);" +
            "   return R * v;" +
            "}" +

            "vec3 rotate3D_Y(vec3 v) {" +
            "   float rho = length(v_position - u_center);" +
            "   float sinPhi = v_position.z / rho;" +
            "   float cosPhi = v_position.x / rho;" +
            "   vec3 col1 = vec3(cosPhi, 0.0, sinPhi);" +
            "   vec3 col2 = vec3(0.0, 1.0, 0.0);" +
            "   vec3 col3 = vec3(-sinPhi, 0.0, cosPhi);" +
            "   mat3 R = mat3(col1, col2, col3);" +
            "   return R * v;" +
            "}" +

            // Let the eye (at infinity) be E.
            // Let hitpoint at the bottom of the pool be H.

            // H -> Water -> Air -> Eye:
            // ---- Let I be the incident point
            // ---- Let alpha be the incident angle
            // ---- Let beta be the refractive angle
            // ---- Let d = distance(I, bottom of pool)
            // ---- Let vR be the reflected ray
            "void main() {" +
            "   vec2 vIEHat = vec2(0.0, 1.0);" +

            "   float rho = length(v_position - u_center);" +
            "   float displacement = u_amplitude * sin(2.0 * PI * (rho - u_speed * u_time) / u_wavelength);" +
            "   float derivative = 2.0 * PI * u_amplitude * cos(2.0 * PI * (rho - u_speed * u_time) / u_wavelength) / u_wavelength;" +

            "   vec2 I_2D = rotate2D(vec2(rho, 0.0));" +
            "   vec3 I = vec3(I_2D.x, u_center.y + displacement, I_2D.y);" +

            "   float angleDiff;" +
            "   vec2 H_wrtCenterRaw;" +
            "   vec3 vRHat; " +
            "   if (derivative == 0.0) {" +
            "       H_wrtCenterRaw = vec2(rho, 0.0);" +
            "       angleDiff = 0.0;" +
            "       vRHat = vec3(0.0, 1.0, 0.0);" +
            "   } else {" +
            "       vec2 nHat = normalize(vec2(1.0, -1.0 / derivative));" +
            "       if (nHat.y < 0.0) {" +
            "           nHat = -nHat;" +
            "       }" +

            "       float beta = acos(dot(vIEHat, nHat));" +
            "       float sinAlpha = u_nAir * sin(beta) / u_nWater;" +
            "       float alpha = asin(sinAlpha);" +

            "       angleDiff = abs(beta - alpha);" +

            "       float d = u_waterHeight + displacement;" +
            "       float offset = d * tan(angleDiff);" +

            "       float x = rho + (nHat.x < 0.0 ? 1.0 : -1.0) * offset;" +
            "       H_wrtCenterRaw = vec2(x, 0.0);" +

            "       vec2 vR_2D = 2.0 * dot(nHat, vIEHat) * nHat - vIEHat;" +
            "       vRHat = normalize(vec3(vR_2D.x, vR_2D.y, 0.0));" +
            "   }" +

            "   H_wrtCenterRaw = rotate2D(H_wrtCenterRaw);" +
            "   vRHat = rotate3D_Y(vec3(rho, u_center.y + displacement, 0.0) + vRHat) - I;" +

            "   vec2 H_wrtCenter = H_wrtCenterRaw / (2.0 * abs(u_xMax - u_center.x));" +
            "   vec2 H_wrtUpperLeft = H_wrtCenter + vec2(0.5, 0.5);" +

            "   vec4 refractedRGBA;" +
            "   if (0.0 <= H_wrtUpperLeft.x && H_wrtUpperLeft.x <= 1.0 &&" +
            "           0.0 <= H_wrtUpperLeft.y && H_wrtUpperLeft.y <= 1.0) {" +
            "       float intensity = pow(cos(angleDiff), u_lightAdjustmentExp);" +
            "       refractedRGBA = texture2D(u_texture, H_wrtUpperLeft);" +
            "       refractedRGBA.rgb = intensity * refractedRGBA.rgb;" +
            "   } else {" +
            "       vec3 direction = vec3(H_wrtCenterRaw.x, u_center.y - u_waterHeight, H_wrtCenterRaw.y) - I;" +
            "       vec3 dirHat = normalize(direction);" +
            "       refractedRGBA = textureCube(u_skybox, dirHat);" +
            "   }" +

            "   vec4 reflectedRGBA = textureCube(u_skybox, vRHat);" +
            "   gl_FragColor = vec4(u_reflectToRefract * reflectedRGBA.rgb + (1.0 - u_reflectToRefract) * refractedRGBA.rgb, 1.0);" +
            "}";
    }
}