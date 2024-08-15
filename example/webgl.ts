import { COLOR_MODE, daltonUtils } from "../index.js";
import {
  createProgram,
  orthographic,
  scale,
  translate,
} from "./webgl-utils.js";

const V_SHADER = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix;

out vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
   v_texcoord = a_texcoord;
}`;

const F_SHADER = `#version 300 es
precision highp float;

in vec2 v_texcoord;

uniform sampler2D u_texture;
uniform int u_color_mode;

out vec4 f_color;

${daltonUtils}

void main() {
  f_color = texture(u_texture, v_texcoord);

  if (u_color_mode != 0) {
    f_color = simulateColorblindness(f_color, u_color_mode);
  }
}`;

export class WebGL {
  canvasEl: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  vao: WebGLVertexArrayObject | null = null;
  shader = {
    dalton: {
      program: WebGLProgram,
      a_position: -1,
      a_textcoord: -1,
      u_color_mode: null as WebGLUniformLocation | null,
      u_matrix: null as WebGLUniformLocation | null,
      u_texture: null as WebGLUniformLocation | null,
    },
  };
  colorMode: (typeof COLOR_MODE)[keyof typeof COLOR_MODE] = COLOR_MODE.OFF;

  private drawInfos: {
    x: number;
    y: number;
    textureInfo;
  }[] = [];

  constructor({
    canvasEl,
    imgURL,
    colorMode = "OFF",
  }: {
    canvasEl: HTMLCanvasElement;
    imgURL: string;
    colorMode?: keyof typeof COLOR_MODE;
  }) {
    this.canvasEl = canvasEl;
    this.gl = canvasEl.getContext("webgl2")!;
    this.colorMode = COLOR_MODE[colorMode];

    this.shader.dalton.program = createProgram({
      gl: this.gl,
      vShaderSrc: V_SHADER,
      fShaderSrc: F_SHADER,
    });

    // attrs & uniforms
    this.shader.dalton.a_position = this.gl.getAttribLocation(
      this.shader.dalton.program,
      "a_position",
    );
    this.shader.dalton.a_textcoord = this.gl.getAttribLocation(
      this.shader.dalton.program,
      "a_texcoord",
    );
    this.shader.dalton.u_color_mode = this.gl.getUniformLocation(
      this.shader.dalton.program,
      "u_color_mode",
    );
    this.shader.dalton.u_matrix = this.gl.getUniformLocation(
      this.shader.dalton.program,
      "u_matrix",
    );
    this.shader.dalton.u_texture = this.gl.getUniformLocation(
      this.shader.dalton.program,
      "u_texture",
    );

    // set color mode (without rendering)
    this.gl.uniform1i(this.shader.dalton.u_color_mode, this.colorMode);

    // Create a vertex array object (attribute state)
    this.vao = this.gl.createVertexArray();

    // and make it the one we're currently working with
    this.gl.bindVertexArray(this.vao);

    // create the position buffer, make it the current ARRAY_BUFFER
    // and copy in the color values
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    // Put a unit quad in the buffer
    const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(positions),
      this.gl.STATIC_DRAW,
    );

    // Turn on the attribute
    this.gl.enableVertexAttribArray(this.shader.dalton.a_position);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    this.gl.vertexAttribPointer(
      this.shader.dalton.a_position,
      2, // 2 components per iteration
      this.gl.FLOAT, // the data is 32bit floats
      false, // don't normalize the data
      0, // 0 = move forward size * sizeof(type) each iteration to get the next position
      0, // start at the beginning of the buffer
    );
    this.gl.vertexAttribPointer(
      this.shader.dalton.a_position,
      2, // 2 components per iteration
      this.gl.FLOAT, // the data is 32bit floats
      false, // don't normalize the data
      0, // 0 = move forward size * sizeof(type) each iteration to get the next position
      0, // start at the beginning of the buffer
    );

    // create the texcoord buffer, make it the current ARRAY_BUFFER
    // and copy in the texcoord values
    const texcoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texcoordBuffer);
    // Put texcoords in the buffer
    const texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(texcoords),
      this.gl.STATIC_DRAW,
    );

    // Turn on the attribute
    this.gl.enableVertexAttribArray(this.shader.dalton.a_textcoord);

    // Tell the attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    this.gl.vertexAttribPointer(
      this.shader.dalton.a_textcoord,
      2, // 3 components per iteration
      this.gl.FLOAT, // the data is 32bit floats
      true, // convert from 0-255 to 0.0-1.0
      0, // 0 = move forward size * sizeof(type) each iteration to get the next color
      0, // start at the beginning of the buffer
    );

    this.loadImg(imgURL);
    this.render();
  }

  setColorMode(mode: keyof typeof COLOR_MODE) {
    if (!(mode in COLOR_MODE)) {
      throw new Error(`Unsupported color mode "${mode}"`);
    }
    this.colorMode = COLOR_MODE[mode];
    this.gl.uniform1i(this.shader.dalton.u_color_mode, this.colorMode);
    this.render();
  }

  loadImg(url: string) {
    const idx = this.drawInfos.length;

    // create placeholder which will get updated later
    this.drawInfos.push({
      textureInfo: {
        width: 1,
        height: 1,
        texture: this.gl.createTexture(),
      },
      x: 0,
      y: 0,
    });

    const tex = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      1,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]),
    );

    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE,
    );

    const img = new Image();
    img.addEventListener("load", () => {
      // update info after load
      this.drawInfos[idx].textureInfo.width = img.width;
      this.drawInfos[idx].textureInfo.height = img.height;

      this.gl.bindTexture(
        this.gl.TEXTURE_2D,
        this.drawInfos[idx].textureInfo.texture,
      );
      this.canvasEl.width = img.width;
      this.canvasEl.height = img.height;
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        img,
      );
      this.gl.generateMipmap(this.gl.TEXTURE_2D);

      this.render();
    });
    img.src = url;
  }

  render() {
    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Clear the canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Draw all images (there’s only one; TODO remove the array)
    for (const {
      textureInfo: { texture, width, height },
      x,
      y,
    } of this.drawInfos) {
      this.gl.useProgram(this.shader.dalton.program);

      // Setup the attributes for the quad
      this.gl.bindVertexArray(this.vao);

      const textureUnit = 0;
      // The the shader we're putting the texture on texture unit 0
      this.gl.uniform1i(this.shader.dalton.u_texture, textureUnit);

      // Bind the texture to texture unit 0
      this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      // this matrix will convert from pixels to clip space
      let matrix = orthographic(
        0,
        this.canvasEl.clientWidth,
        this.canvasEl.clientHeight,
        0,
        -1,
        1,
      );

      // translate our quad to dstX, dstY
      matrix = translate(matrix, x, y, 0);

      // scale our 1 unit quad
      // from 1 unit to texWidth, texHeight units
      matrix = scale(matrix, width, height, 1);

      // Set the matrix.
      this.gl.uniformMatrix4fv(this.shader.dalton.u_matrix, false, matrix);

      // draw the quad (2 triangles, 6 vertices)
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
  }
}
