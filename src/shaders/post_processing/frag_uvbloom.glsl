precision mediump float;

// this is expected name unless we want to build our own custom shader pass
uniform sampler2D tDiffuse;
uniform float uIntensity;
uniform float uBrightnessThreshold;

in vec2 vUv;
// multiple render targets (MRT)
layout (location = 0) out vec4 fragColor;
layout (location = 1) out vec4 brightColor;

// blur stuff
// uniform vec2 uDirection;    // Direction of the blur (horizontal or vertical)
uniform float uBlurAmount;  // Amount of blur
uniform vec2 uResolution;

in vec2 TexCoords;

// end of blur stuff

void main() {
  vec4 color = texture(tDiffuse, vUv);
  
  // Extract brightness using a threshold from the grayscale color
  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Luminance formula
  
  // If brightness is above threshold, keep color, else set to black
  vec4 bloomColor = brightness > uBrightnessThreshold ? color : vec4(0.0); 

  // BLUR STUFF
  // Gaussian weights 
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
    
  // Texel size for offset calculation
  vec2 tex_offset;
  tex_offset.x = 1.0 / float(textureSize(tDiffuse, 0).x);
  tex_offset.y = 1.0 / float(textureSize(tDiffuse, 0).y);

  // Initialize color and total weight
  vec4 blurredColor = vec4(0.0);
  float totalWeight = 0.0;

  // Nested loop for 2D Gaussian blur
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float weight = weights[abs(x)] * weights[abs(y)]; // Combine weights for x and y
      vec2 offset = vec2(float(x), float(y)) * tex_offset * uBlurAmount; // Calculate 2D offset
      
      vec4 sampleFrag = texture(tDiffuse, vUv + offset); // Sample texture
      
      blurredColor += texture(tDiffuse, vUv + offset) * weight;
      totalWeight += weight; // Accumulate total weight
    }
  }

  blurredColor /= totalWeight; // Normalize the color
  fragColor = color + blurredColor * uIntensity; // Combine original color with blurred color
  // END OF BLUR STUFF

  // fragColor = color; // Setting as 'bright' for debugging. Should be 'color'.
}
