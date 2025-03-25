precision mediump float;

uniform sampler2D tDiffuse; // Input texture
uniform vec2 uDirection;    // Direction of the blur (horizontal or vertical)
uniform float uBlurAmount;  // Amount of blur

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 color = vec4(0.0);
  float total = 0.0;

  // Gaussian weights and offsets
  float offsets[5] = float[](0.0, 1.0, 2.0, 3.0, 4.0);
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

  for (int i = 0; i < 5; i++) {
    vec2 offset = uDirection * offsets[i] * uBlurAmount;
    color += texture(tDiffuse, vUv + offset) * weights[i];
    color += texture(tDiffuse, vUv - offset) * weights[i];
    total += weights[i] * 2.0;
  }

  fragColor = color / total; // Normalize the color
}