export const COLOR_MODE = {
  OFF: 0,
  PROTANOPIA: 1,
  DEUTERANOPIA: 2,
  TRITANOPIA: 3,
};

export const attrs = {
  a_color_mode: "a_color_mode",
  a_position: "a_position",
  a_resolution: "a_resolution",
};

export const colorUtils = `float cbrt(float x) {
  return sign(x) * pow(abs(x), 1.0 / 3.0);
}

float srgb_transfer_fn(float a) {
  float v = abs(a);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * pow(v, (1.0 / 2.4)) - 0.055;
}

float srgb_inverse_transfer_fn(float a) {
  float v = abs(a);
  return v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4);
}

vec4 srgb_to_linear_rgb(vec4 srgb) {
  return vec4(
    srgb_inverse_transfer_fn(srgb.x),
    srgb_inverse_transfer_fn(srgb.y),
    srgb_inverse_transfer_fn(srgb.z),
    srgb.w
  );
}

vec4 linear_rgb_to_srgb(vec4 linear_rgb) {
  return vec4(
    srgb_transfer_fn(linear_rgb.x),
    srgb_transfer_fn(linear_rgb.y),
    srgb_transfer_fn(linear_rgb.z),
    linear_rgb.w
  );
}

vec4 linear_rgb_to_lms(vec4 linear_rgb) {
  return vec4(
    cbrt(0.4122214708 * linear_rgb.x + 0.5363325363 * linear_rgb.y + 0.0514459929 * linear_rgb.z),
    cbrt(0.2119034982 * linear_rgb.x + 0.6806995451 * linear_rgb.y + 0.1073969566 * linear_rgb.z),
    cbrt(0.0883024619 * linear_rgb.x + 0.2817188376 * linear_rgb.y + 0.6299787005 * linear_rgb.z),
    linear_rgb.w
  );
}

vec4 lms_to_linear_rgb(vec4 lms) {
  return vec4(
    +4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z,
    -1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z,
    -0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.7076147010 * lms.z,
    lms.w
  );
}`;

export const daltonUtils = `vec4 applyProtanope_Vienot(vec4 lms) {
  // DaltonLens-Python Simulator_Vienot1999.lms_projection_matrix
  lms[0] = 2.02344*lms[1] - 2.52580*lms[2];
  return lms;
}

vec4 applyDeuteranope_Vienot(vec4 lms) {
  // DaltonLens-Python Simulator_Vienot1999.lms_projection_matrix
  lms[1] = 0.49421*lms[0] + 1.24827*lms[2];
  return lms;
}

vec4 applyTritanope_Vienot(vec4 lms) {
  // DaltonLens-Python Simulator_Vienot1999.lms_projection_matrix
  // WARNING: Viénot is not good for tritanopia, we need
  // to switch to Brettel.
  lms[2] = -0.01224*lms[0] + 0.07203*lms[1];
  return lms;
}

vec4 applyTritanope_Brettel1997(vec4 lms) {
  // See libDaltonLens for the values.
  vec4 normalOfSepPlane = vec4(0.34478, -0.65518, 0.00000, lms.w);
  if (dot(lms, normalOfSepPlane) >= 0.0) {
    // Plane 1 for tritanopia
    lms.z = -0.00257 * lms.x + 0.05366 * lms.y;
  } else {
    // Plane 2 for tritanopia
    lms.z = -0.06011 * lms.x + 0.16299 * lms.y;
  }
  return lms;
}

vec4 simulateColorblindness(vec4 srgb, int colorMode) {
  if (colorMode == 0) {
    return srgb;
  }
  vec4 lms = linear_rgb_to_lms(srgb_to_linear_rgb(srgb));
  switch (colorMode) {
    case 1: lms = applyProtanope_Vienot(lms); break;
    case 2: lms = applyDeuteranope_Vienot(lms); break;
    case 3: lms = applyTritanope_Brettel1997(lms); break;
  }
  return linear_rgb_to_srgb(lms_to_linear_rgb(lms));
}`;

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
