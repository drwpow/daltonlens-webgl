export declare const COLOR_MODE: {
  OFF: 0;
  PROTANOPIA: 1;
  DEUTERANOPIA: 2;
};

/** Shared attrs */
export declare const attrs: {
  a_color_mode: string;
  a_position: string;
  a_resolution: string;
};

/** Color utils (sRGB, linear RGB, and LMS conversions) */
export declare const colorUtils: string;

/** Dalton utils (protanopia, deuteranopia, etc.) */
export declare const daltonUtils: string;

/** Vertex shader */
export declare const vShader: string;

/** Fragment shader */
export declare const fShader: string;

declare const shader: { vShader: string; fShader: string };
export default shader;
