Author: Quan Le | minhquanle@arizona.edu  
Course: CSC 433  
Date: April 23, 2024

# How to Execute the Program

1. Open `index.html` in a browser.  
2. Go into one of the 3 folders: `materials/clouds`, `materials/scenic`, or `materials/spectrum`  
3. Upload the all 8 files in that folder:  
  * `materials/f-texture.png`  
  * `materials/test_scene.json`  
  * `materials/skybox_*.png`  
4. [Optional] Play around with the sliders and checkbox.

# Implementation Description

### Features for HW5

The scene involves a billboard placed at the bottom of a pool.  
The surface of the pool will have wave effects applied to it.  

Shader programming is used to render the scene.

Wave propagation follows the popular wave model: `y = Asin(2pi(x - vt) / lambda)`, where:  
  * `A` (unit): Amplitude of the wave  
  * `v` (unit / sec): Velocity of wave propagation  
  * `t` (sec): Elapsed time  
  * `lambda` (unit): Wavelength

The vertex shader simply passes the position to the fragment shader, which handles the majority of the logic.

The fragment shader does the following:  
  * Computes the displacement `y` according to the aforementioned model, which helps calculate the point of incident, `I`.  
  * Computes the normal at the point `I`.  
  * The camera is assumed to be located at infinity, so the ray exiting the water to reach the camera points directly upward.  
  * Given the exiting ray (in the air) and the normal at `I`, Snell's law is applied to calculate the incident ray (in the water).  
  * After processing the refractive effect, the intensity of the light is also modified depending on how much the light is refracted.  
  * My implementation employs the method similar to Phong's shading. In particular, I raise the cosine of the angle to some power for a more drastic effect.  
  * After light modification, the reflected ray is calculated.  
  * By using environmental mapping, the surrounding (determined by a skybox) is reflected onto the water surface.  
  * The reflection and refraction effects can be controlled by a slider.

Most of the logic is done on the basis of surface of revolution.  
Since the wave effect is radial (i.e., the shape has a line of symmetry), I simply compute most of the logic in 2D, then revolve the points and vectors by a certain angle to obtain the final calculations.  
As a result, I can generalize the implementation to make the wave have any shape I want simply by changing the propagation formula.

### Explanation for Sliders and Checkbox

There are a few configurations available in my implementation.

The `Amplitude` slider controls how high the wave can reach.

The `Wavelength` slider controls how far apart the waves are.

The `Water Height` slider controls how deep the pool is. Note that the bottom of the pool is fixed.  
Only the water surface changes according to the water height.

The `Wave Speed` slider controls how fast the wave propagates.

The `Light Adjustment Exponent` slider controls how drastic light modification is.  
The higher the exponent, the more contrast there is between parts of the wave.

The `Reflected to Refracted Ratio` slider controls how much of the light is reflected or refracted.  
If this slider is set to `0`, then only refraction can be seen.  
If it is set to `1`, then only reflection can be seen.

The `Water Index` slider controls the refractive index of the water.  
The refractive index of the air is always `1`.

The `Enable Animation` checkbox allows the user to pause or play the animation as they want.

### Extra Credits

I added a slider to control the `Reflected to Refracted Ratio`. I included two skyboxes to make it interesting to observe the effects.

# Included Files

* `materials/clouds/` -- The folder including the scene required files and a skybox featuring clouds.
* `materials/scenic/` -- The folder including the scene required files and a skybox featuring a nice scene.
* `materials/spectrum/` -- The folder including the scene required files and a skybox featuring colors.
* `outputs/Demo.mp4` -- A demo video that shows how the scene is rendered.
* `a05.js` -- JavaScript file containing the core logic.
* `index.html` -- File to run the program.
* `m4.js` -- Library to deal with homogeneous (`4 x 4`) matrices.
* `math.js` -- Library defining `Vector3` and `Tools` classes with useful operations.
* `png.js` -- Library for parsing PNG images (https://github.com/arian/pngjs).
* `scene.js` -- Library defining the `Scene` class.
* `sceneObjects.js` -- Library defining the `Camera`, `Billboard` (for the water surface and the pool bottom), and `SceneImage` classes.
* `shaderProg.js` -- Contains the logic for creating programs necessary for communicating with the `VertexShader` and `FragmentShader` and for binding buffers.
* `style.css` -- Contains the styles for various HTML elements.
* `webgl-utils.js` -- Library for using WebGL.

# Attributions

Some libraries taken from outer sources:
* `png.js`: https://github.com/arian/pngjs
* `materials/clouds/skybox_*.png`: https://www.cleanpng.com/users/@joenecia.html
* `materials/scenic/skybox_*.png`: https://learnopengl.com/Advanced-OpenGL/Cubemaps