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

/** Vertex shader */
export declare const vShader: string;

/** Fragment shader */
export declare const fShader: string;

declare const shader: { vShader: string; fShader: string };
export default shader;
