// currently not used
// shader for render pass to combine outputs from multiple render targets
precision mediump float;

uniform sampler2D tScene; // Original scene texture
uniform sampler2D tBloom; // Blurred bright areas texture
uniform float uBloomIntensity; // Intensity of the bloom effect

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 sceneColor = texture(tScene, vUv);
  vec4 bloomColor = texture(tBloom, vUv) * uBloomIntensity;
  fragColor = sceneColor + bloomColor; // Combine the scene and bloom
}