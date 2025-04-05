precision mediump float;

uniform sampler2D tDiffuse; // Input texture
uniform vec2 uDirection;    // Direction of the blur (horizontal or vertical)
uniform float uBlurAmount;  // Amount of blur
uniform float uIntensity;

in vec2 vUv;
in vec2 TexCoords;

out vec4 fragColor;

const int M = 16;
const int N = 2 * M + 1;

// Gaussian weights 
const float coeffs[N] = float[N](
	0.012318109844189502,
	0.014381474814203989,
	0.016623532195728208,
	0.019024086115486723,
	0.02155484948872149,
	0.02417948052890078,
	0.02685404941667096,
	0.0295279624870386,
	0.03214534135442581,
	0.03464682117793548,
	0.0369716985390341,
	0.039060328279673276,
	0.040856643282313365,
	0.04231065439216247,
	0.043380781642569775,
	0.044035873841196206,
	0.04425662519949865,
	0.044035873841196206,
	0.043380781642569775,
	0.04231065439216247,
	0.040856643282313365,
	0.039060328279673276,
	0.0369716985390341,
	0.03464682117793548,
	0.03214534135442581,
	0.0295279624870386,
	0.02685404941667096,
	0.02417948052890078,
	0.02155484948872149,
	0.019024086115486723,
	0.016623532195728208,
	0.014381474814203989,
	0.012318109844189502
);

void main() {

  vec4 color = texture(tDiffuse, vUv); // Sample the texture at the current UV coordinates

    
  // Texel size for offset calculation
  vec2 tex_offset;
  tex_offset.x = 1.0 / float(textureSize(tDiffuse, 0).x) * uBlurAmount;
  tex_offset.y = 1.0 / float(textureSize(tDiffuse, 0).y) * uBlurAmount;

  // Calculates contribution of nearby pixels to the color
  vec4 blurredColor = vec4(0.0);

  for (int i = 0; i < N; i++) {

    for (int j = 0; j < M; j++) {
      vec2 offset = vUv + tex_offset * vec2(float(i - M), float(j - M));
      blurredColor += coeffs[i] * coeffs[j] * texture(tDiffuse, offset);
    }
  }

  fragColor = color + blurredColor * uIntensity; // Set the color
}
