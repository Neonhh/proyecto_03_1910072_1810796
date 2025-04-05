precision mediump float;

// this is expected name unless we want to build our own custom shader pass
uniform sampler2D tDiffuse;
uniform float uIntensity;
uniform float uBrightnessThreshold;

in vec2 vUv;
out vec4 fragColor;


void main() {
  vec4 color = texture(tDiffuse, vUv);
  
  // Extract brightness using a threshold from the grayscale color
  float brightness = dot(color.rgb, vec3(0.2126, 0.7512, 0.0722)); // Luminance formula
  vec4 bright;
  if (brightness > uBrightnessThreshold){
    bright = color;
  }
  else {
    bright = vec4(vec3(0.0), 1.0); // Set to black if below threshold
  }

  fragColor = vec4(color.xyz * clamp(brightness, 0.0, 1.0), 1.0);
}
