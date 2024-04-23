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

    /**
     * Link the geometric data of the Billboard to appropriate buffers.
     */
    setBuffers(webGLContext, billboard) {
        var positions = new Float32Array([
            // Triangle 1
            billboard.A.x, billboard.A.y, billboard.A.z,
            billboard.D.x, billboard.D.y, billboard.D.z,
            billboard.B.x, billboard.B.y, billboard.B.z,
            // Triangle 2
            billboard.B.x, billboard.B.y, billboard.B.z,
            billboard.D.x, billboard.D.y, billboard.D.z,
            billboard.C.x, billboard.C.y, billboard.C.z
        ]);
        this.setPositionBuffer(webGLContext, positions);
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
        this.u_texture = webGLContext.getUniformLocation(this.program, "u_texture");
        this.u_center = webGLContext.getUniformLocation(this.program, "u_center");
        this.u_xMax = webGLContext.getUniformLocation(this.program, "u_xMax");
        this.u_defaultColor = webGLContext.getUniformLocation(this.program, "u_defaultColor");

        this.u_nAir = webGLContext.getUniformLocation(this.program, "u_nAir");
        this.u_nWater = webGLContext.getUniformLocation(this.program, "u_nWater");

        this.u_amplitude = webGLContext.getUniformLocation(this.program, "u_amplitude");
        this.u_speed = webGLContext.getUniformLocation(this.program, "u_speed");
        this.u_time = webGLContext.getUniformLocation(this.program, "u_time");
        this.u_wavelength = webGLContext.getUniformLocation(this.program, "u_wavelength");
        this.u_waterHeight = webGLContext.getUniformLocation(this.program, "u_waterHeight");

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

            "uniform sampler2D u_texture;" +
            "uniform vec3 u_center;" +
            "uniform float u_xMax;" +
            "uniform vec4 u_defaultColor;" +

            "uniform float u_nAir;" +
            "uniform float u_nWater;" +

            "uniform float u_amplitude;" +
            "uniform float u_speed;" +
            "uniform float u_time;" +
            "uniform float u_wavelength;" +
            "uniform float u_waterHeight;" +

            "vec2 rotate2D(vec2 v) {" +
            "   float rho = length(v_position - u_center);" +
            "   float sinPhi = v_position.z / rho;" +
            "   float cosPhi = v_position.x / rho;" +
            "   vec2 col1 = vec2(cosPhi, sinPhi);" +
            "   vec2 col2 = vec2(-sinPhi, cosPhi);" +
            "   mat2 R = mat2(col1, col2);" +
            "   return R * v;" +
            "}" +

            // Let the eye (at infinity) be E.
            // Let hitpoint at the bottom of the pool be H.

            // H -> Water -> Air -> Eye:
            // ---- Let I be the incident point
            // ---- Let alpha be the incident angle
            // ---- Let beta be the refractive angle
            // ---- Let d = distance(I, bottom of pool)
            "void main() {" +
            "   vec2 vIEHat = vec2(0.0, 1.0);" +

            "   float rho = length(v_position - u_center);" +
            "   float derivative = 2.0 * PI * u_amplitude * cos(2.0 * PI * (rho - u_speed * u_time) / u_wavelength) / u_wavelength;" +

            "   vec2 H_wrtCenter;" +
            "   if (derivative == 0.0) {" +
            "       H_wrtCenter = vec2(rho / (2.0 * abs(u_xMax - u_center.x)), 0.0);" +
            "   } else {" +
            "       vec2 nHat = normalize(vec2(1.0, -1.0 / derivative));" +
            "       if (nHat.y < 0.0) {" +
            "           nHat = -nHat;" +
            "       }" +

            "       float beta = acos(dot(vIEHat, nHat));" +
            "       float sinAlpha = u_nAir * sin(beta) / u_nWater;" +
            "       float alpha = asin(sinAlpha);" +

            "       float angleDiff = abs(beta - alpha);" +

            "       float displacement = u_amplitude * sin(2.0 * PI * (rho - u_speed * u_time) / u_wavelength);" +
            "       float d = u_waterHeight + displacement;" +
            "       float offset = d * tan(angleDiff);" +

            "       float x = rho + (nHat.x < 0.0 ? 1.0 : -1.0) * offset;" +
            "       H_wrtCenter = vec2(x / (2.0 * abs(u_xMax - u_center.x)), 0.0);" +
            "   }" +

            "   H_wrtCenter = rotate2D(H_wrtCenter);" +
            "   vec2 H_wrtUpperLeft = H_wrtCenter + vec2(0.5, 0.5);" +

            "   if (0.0 <= H_wrtUpperLeft.x && H_wrtUpperLeft.x <= 1.0 &&" +
            "           0.0 <= H_wrtUpperLeft.y && H_wrtUpperLeft.y <= 1.0) {" +
            "       gl_FragColor = texture2D(u_texture, H_wrtUpperLeft);" +
            "   } else {" +
            "       gl_FragColor = u_defaultColor;" +
            "   }" +
            "}";
    }
}