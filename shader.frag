#version 300 es

out vec4 f_color;

void main() {
  f_color = blend_srgb(v_start_color, v_end_color, a);
}