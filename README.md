# daltonlens-webgl

WebGL port of DaltonLens protanopia/deuteranopia simulation.

## Usage

```sh
npm i daltonlens-webgl
```

### Basic JS

The default export ships an object with `vShader` and `fShader` that contains a string of the shader code:

```js
import daltonLens from "daltonlens-webgl";

daltonLens.vShader; // vector shader
daltonLens.fShader; // fragment shader
```

Example of loading using generic WebGL code:

```js
const canvasEl = document.getElementById("canvas");
const gl = canvasEl.getContext("webgl2");

// vertex shader
const vShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader, daltonLens.vShader);
gl.compileShader(vShader);
if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
  throw new Error(
    `VECTOR SHADER: ${gl.getShaderInfoLog(vShader) || "unknown"}`
  );
}

// fragment shader
const fShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader, daltonLens.fShader);
gl.compileShader(fShader);
if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
  throw new Error(
    `FRAGMENT SHADER: ${gl.getShaderInfoLog(fShader) || "unknown"}`
  );
}
```

### .frag / .vert files

Alternately, this package ships `shader.frag` and `shader.vert` if you prefer loading shaders that way:

```js
import vShader from "daltonlens-webgl/shader.vert";
import fShader from "daltonlens-webgl/shader.frag";
```

Note this will likely take custom Vite or webpack config to work though.
