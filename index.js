export const COLOR_MODE = {
  OFF: 0,
  PROTANOPIA: 1,
  DEUTERANOPIA: 2,
};

export const attrs = {
  a_color_mode: "a_color_mode",
  a_position: "a_position",
  a_resolution: "a_resolution",
};

export const vShader = `#version 300 es
precision highp float;

in float ${attrs.a_color_mode};
in vec4 ${attrs.a_position};
in vec2 ${attrs.a_resolution};

out float v_color_mode;
out vec2 v_resolution;
out vec4 v_color;

void main() {
  v_color_mode = ${attrs.a_color_mode};
  v_resolution = ${attrs.a_resolution};
  gl_Position = a_position;
}`;

export const fShader = `#version 300 es
precision highp float;

in vec2 v_resolution;
in float v_color_mode;

out vec4 f_color;

void main() {
  // vec4 color = gl_FragColor;
  vec2 pos = gl_FragCoord.xy / v_resolution;

  if (v_color_mode == 1.0) {
    f_color = vec4(0.0, 1.0, 0.0, 1.0);
  } else if (v_color_mode == 2.0) {
    f_color = vec4(1.0, 0.0, 0.0, 1.0);
  }
}`;

export default { vShader, fShader };
