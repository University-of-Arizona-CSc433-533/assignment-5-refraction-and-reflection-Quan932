/**
 * Scene object contains the following main components:
 * ---- Camera
 * ---- Water Surface
 * ---- Billboard
 */
class Scene {
    constructor(sceneDataJSON) {
        var sceneData = JSON.parse(sceneDataJSON);

        // Init metadata
        this.sun = Vector3.fromArray(sceneData.SunLocation);
        this.defaultColor = Vector3.fromArray(sceneData.DefaultColor);

        if (sceneData.waterSurface != null) {
            this.waterSurface = new Billboard(sceneData.waterSurface);
        }

        if (sceneData.billboard != null) {
            this.billboard = new Billboard(sceneData.billboard);
        }

        // Init camera
        this.cam = new Camera(sceneData);
    }

    static _defaultColor = null;
    static get DefaultColor() {
        if (this._defaultColor == null) {
            this._defaultColor = new Vector3(0.95, 0.5, 0.4);
        }
        return this._defaultColor;
    }
}