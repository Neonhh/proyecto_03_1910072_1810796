precision mediump float;

// this is expected name unless we want to build our own custom shader pass
uniform sampler2D tDiffuse;
uniform float uIntensity;
uniform float uBrightnessThreshold;

in vec2 vUv;
// multiple render targets (MRT)
layout (location = 0) out vec4 fragColor;
layout (location = 1) out vec4 brightColor;


void main() {
  vec4 color = texture(tDiffuse, vUv);
  
  // Extract brightness using a threshold from the grayscale color
  float brightness = dot(color.rgb, vec3(0.2126, 0.7512, 0.0722)); // Luminance formula
  vec4 bright;
  if (brightness > uBrightnessThreshold){
    bright = color;
  }
  else {
    bright = vec4(0.0,0.0,0.0,1.0);
  }

  fragColor = color; // Setting as 'bright' for debugging. Should be 'color'.
  brightColor = bright;    // Output the bright areas for bloom
}
