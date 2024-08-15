#version 300 es
precision highp float;

in vec2 v_texcoord;

uniform sampler2D u_texture;
uniform int u_color_mode;

out vec4 f_color;

// Warning: GLSL mat3 initialization is column by column
// DaltonLens-Python LMSModel_sRGB_SmithPokorny75.LMS_from_linearRGB
const mat3 LMS_from_linearRGB = mat3(
  0.17882, 0.03456, 0.00030, // column1
  0.43516, 0.27155, 0.00184, // column2
  0.04119, 0.03867, 0.01467  // column3
);

const mat3 linearRGB_from_LMS = mat3(
    8.09444,  -1.02485, -0.03653, // column1
  -13.05043,   5.40193, -0.41216, // column2
   11.67206, -11.36147, 69.35132  // column3
);

// https://gamedev.stackexchange.com/questions/92015/optimized-linear-to-srgb-glsl
// Converts a color from linear light gamma to sRGB gamma
vec4 sRGB_from_RGB(vec4 linearRGB) {
  bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
  vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
  vec3 lower = linearRGB.rgb * vec3(12.92);

  return vec4(mix(higher, lower, cutoff), linearRGB.w);
}

vec4 sRGB_from_RGBClamped(vec4 rgba) {
  return sRGB_from_RGB(clamp(rgba, 0.0, 1.0));
}

// Converts a color from sRGB gamma to linear light gamma
vec4 RGB_from_SRGB(vec4 sRGB) {
  bvec3 cutoff = lessThan(sRGB.rgb, vec3(0.04045));
  vec3 higher = pow((sRGB.rgb + vec3(0.055))/vec3(1.055), vec3(2.4));
  vec3 lower = sRGB.rgb/vec3(12.92);

  return vec4(mix(higher, lower, cutoff), sRGB.a);
}

vec4 LMS_from_RGBA(vec4 rgba) {
  return vec4(LMS_from_linearRGB * rgba.xyz, rgba.w);
}

vec4 RGBA_from_LMS(vec4 lms) {
  return vec4(linearRGB_from_LMS * lms.xyz, lms.w);
}

vec4 applyProtanope_Vienot(vec4 lms) {
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
  vec4 lms = LMS_from_RGBA(RGB_from_SRGB(srgb));
  vec4 lmsSimulated = vec4(0.0, 1.0, 0.0, 1.0);
  switch (colorMode) {
    case 1: {
      lmsSimulated = applyProtanope_Vienot(lms);
      break;
    }
    case 2: {
      lmsSimulated = applyDeuteranope_Vienot(lms);
      break;
    }
    case 3: {
      lmsSimulated = applyTritanope_Brettel1997(lms);
      break;
    }
  }
  return sRGB_from_RGBClamped(RGBA_from_LMS(lmsSimulated));
}

void main() {
  f_color = texture(u_texture, v_texcoord);

  if (u_color_mode != 0) {
    f_color = simulateColorblindness(f_color, u_color_mode);
  }
}