precision mediump float;

uniform sampler2D tDiffuse; // Input texture
uniform vec2 uDirection;    // Direction of the blur (horizontal or vertical)
uniform float uBlurAmount;  // Amount of blur

in vec2 vUv;
in vec2 TexCoords;

out vec4 fragColor;

void main() {

  // Gaussian weights 
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
    
  // Texel size for offset calculation
  vec2 tex_offset;
  tex_offset.x = 1.0 / float(textureSize(tDiffuse, 0).x);
  tex_offset.y = 1.0 / float(textureSize(tDiffuse, 0).y);

  // Calculates contribution of nearby pixels to the color
  vec4 color = vec4(0.0);
  float total = 0.0;

  for (int i = 0; i < 5; i++) {
    vec2 offset = uDirection * float(i) * uBlurAmount * tex_offset;
    color += texture(tDiffuse, vUv + offset) * weights[i];
    color += texture(tDiffuse, vUv - offset) * weights[i];
    total += weights[i] * 2.0;
  }

  fragColor = color / total; // Normalize the color
}