import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";

// Post-processing imports
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Post-processing shaders
import ppVertexShader from "./shaders/post_processing/vertex.glsl";
import ppFragmentUVBloom from "./shaders/post_processing/frag_uvbloom.glsl";
import ppFragmentBlur from "./shaders/post_processing/blur.glsl";
// import ppCombine from "./shaders/post_processing/combine.glsl";

// Define shader definition interface
interface ShaderDefinition {
  uniforms: Record<string, { value: any }>;
  vertexShader: string;
  fragmentShader: string;
}

// Post-processing effect interface
interface Effect {
  pass: ShaderPass;
  name: string;
  enabled: boolean;
  params?: Record<string, any>;
}

// Define shaders for post-processing
// And uniforms to be visible to the GUI
const bloomUniforms = {
  uBrightnessThreshold: 0.2,
};
const bloomShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 1.0 },
    uBrightnessThreshold: { value: bloomUniforms.uBrightnessThreshold }, // Corrected spelling
  },
  vertexShader: ppVertexShader,
  fragmentShader: ppFragmentUVBloom,
};

const blurUniforms = {
  uBlurAmount: 1.8,
  uIntensity: 1.5,
  uDirection: new THREE.Vector2(1.0, 0.0),
};
const blurShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    uDirection: { value: new THREE.Vector2(1.0, 0.0) },
    uBlurAmount: { value: blurUniforms.uBlurAmount },
    uIntensity: { value: blurUniforms.uIntensity },
  },
  vertexShader: ppVertexShader,
  fragmentShader: ppFragmentBlur,
};

const combineUniforms = {
  uIntensity: 1.0,
};
// const combineShader: ShaderDefinition = {
//   uniforms: {
//     tScene: { value: null },
//     tBloom: { value: null },
//     uIntensity: { value: combineUniforms.uIntensity },
//   },
//   vertexShader: ppVertexShader,
//   fragmentShader: ppCombine,
// };

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Post-processing
  private composer: EffectComposer;
  private effects: Map<string, Effect>;
  private sceneRenderTarget: THREE.WebGLRenderTarget;
  // private bloomRenderTarget: THREE.WebGLRenderTarget;

  // Animation
  private mixer: THREE.AnimationMixer;
  private clock: THREE.Clock = new THREE.Clock(true);

  private camConfig = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
  };

  constructor() {
    // Create scene
    this.scene = new THREE.Scene();

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      this.camConfig.fov,
      this.camConfig.aspect,
      this.camConfig.near,
      this.camConfig.far,
    );

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    if (!this.renderer.capabilities.isWebGL2) {
      console.warn("WebGL 2.0 is not available on this browser.");
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const canvas = document.body.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.effects = new Map<string, Effect>();
    this.sceneRenderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
      },
    );
    // this.bloomRenderTarget = new THREE.WebGLRenderTarget(
    //   window.innerWidth,
    //   window.innerHeight,
    //   {
    //     format: THREE.RGBAFormat,
    //     type: THREE.UnsignedByteType,
    //   },
    // );

    this.mixer = new THREE.AnimationMixer(this.scene); // Initialize the mixer

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 10.0); // Soft white light
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3); // Bright white light
    directionalLight.position.set(1, 1, 1).normalize(); // Position the light at an angle
    this.camera.position.z = 3.0;

    // Import neon model
    const loader = new GLTFLoader();
    loader.load(
      "src/models/primary_ion_drive.glb",
      (gltf) => {
        const scale = 0.5;
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(0, 0, 0);
        this.mixer = new THREE.AnimationMixer(model); // Initialize the mixer with the loaded model
        const animation = gltf.animations[0];
        const action = this.mixer.clipAction(animation);
        action.play();

        this.scene.add(model);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (err) => {
        console.log(err);
      },
    );

    const controls = new OrbitControls(this.camera, canvas);
    controls.enableDamping = true;

    //GUI Controls
    const gui = new GUI();
    const folder = gui.addFolder("General Settings");
    folder
      .add(bloomUniforms, "uBrightnessThreshold", 0.0, 1.0)
      .name("Brightness Threshold")
      .onChange((value: GLfloat) => {
        this.updateEffectParam("bloom", "uBrightnessThreshold", value);
      });
    folder
      .add(blurUniforms, "uBlurAmount", 0.0, 10.0)
      .name("Blur Amount")
      .onChange((value: number) => {
        this.updateEffectParam("blurH", "uBlurAmount", value);
        this.updateEffectParam("blurV", "uBlurAmount", value);
      });
    folder
      .add(blurUniforms, "uIntensity", 0.0, 5.0)
      .name("Bloom Brightness")
      .onChange((value: number) => {
        this.updateEffectParam("blurH", "uIntensity", value);
        this.updateEffectParam("blurV", "uIntensity", value);
      });
    folder
      .add(combineUniforms, "uIntensity", 0.0, 10.0)
      .name("Intensity")
      .onChange((value: number) => {
        this.updateEffectParam("combine", "uIntensity", value);
      });
    folder
      .add({ blurH: true }, "blurH")
      .name("Enable Horizontal Blur")
      .onChange((enabled: boolean) => {
        this.toggleEffect("blurH", enabled);
      });
    folder
      .add({ blurV: true }, "blurV")
      .name("Enable Vertical Blur")
      .onChange((enabled: boolean) => {
        this.toggleEffect("blurV", enabled);
      });

    folder
      .add({ bloom: true }, "bloom")
      .name("Enable Bloom")
      .onChange((enabled: boolean) => {
        this.toggleEffect("bloom", enabled);
      });

    // Initialize post-processing
    this.setupPostProcessing();

    // Initialize
    this.onWindowResize();

    // Bind methods
    this.onWindowResize = this.onWindowResize.bind(this);
    this.animate = this.animate.bind(this);

    // Add event listeners
    window.addEventListener("resize", this.onWindowResize);

    // Start the main loop
    this.animate();
  }

  // Set post-processing pipeline
  private setupPostProcessing(): void {
    // Initialize the effect composer
    this.renderer.setClearColor(0x000000, 1.0); // Transparent background

    // Add the render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Initialize effects collection
    this.effects = new Map<string, Effect>();

    // Add bloom effect
    this.addEffect("bloom", bloomShader);

    // Add two-pass Gaussian blur
    this.addEffect("blurH", blurShader, {
      uDirection: new THREE.Vector2(1.0, 0.0),
    }); //Horizontal
    this.addEffect("blurV", blurShader, {
      uDirection: new THREE.Vector2(0.0, 1.0),
    }); //Vertical

    // this.addEffect("combine", combineShader, {
    //   tScene: this.sceneRenderTarget.texture,
    //   tBloom: this.bloomRenderTarget.texture,
    // }); // Combine the two passes
  }

  private createGLSL3ShaderPass(
    shaderDefinition: ShaderDefinition,
  ): ShaderPass {
    // Hello, old friend
    // Create a custom material that explicitly uses GLSL 3.0
    const material = new THREE.RawShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(shaderDefinition.uniforms),
      vertexShader: shaderDefinition.vertexShader,
      fragmentShader: shaderDefinition.fragmentShader,
      glslVersion: THREE.GLSL3,
    });

    // Create a ShaderPass with this material
    const pass = new ShaderPass(material);
    return pass;
  }

  public addEffect(
    name: string,
    shaderDefinition: ShaderDefinition,
    params?: Record<string, any>,
  ): void {
    // GLSL 1.0 regular stuff
    // const pass = new ShaderPass(shaderDefinition);
    // GLSL 3.0 custom material
    const pass = this.createGLSL3ShaderPass(shaderDefinition);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (pass.uniforms[key] !== undefined) {
          pass.uniforms[key].value = value;
        }
      });
    }

    // Add the pass to the composer
    this.composer.addPass(pass);

    // Store the effect for later manipulation
    this.effects.set(name, {
      pass,
      name,
      enabled: true,
      params,
    });
  }

  public toggleEffect(name: string, enabled: boolean): void {
    const effect = this.effects.get(name);
    if (effect) {
      effect.pass.enabled = enabled;
      effect.enabled = enabled;
    }
  }

  public updateEffectParam(name: string, paramName: string, value: any): void {
    const effect = this.effects.get(name);
    if (effect && effect.pass.uniforms[paramName] !== undefined) {
      effect.pass.uniforms[paramName].value = value;
      if (effect.params) {
        effect.params[paramName] = value;
      }
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    this.renderer.setRenderTarget(this.sceneRenderTarget);
    this.renderer.render(this.scene, this.camera);

    // this.renderer.setRenderTarget(this.bloomRenderTarget);
    this.composer.render();

    this.renderer.setRenderTarget(null);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    //this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

    // Update the renderer when resizing, this is necessary
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Update the composer when resizing
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}

new App();
