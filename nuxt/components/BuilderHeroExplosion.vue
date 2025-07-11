<template>
  <section class="builder-hero-explosion pad-bl" ref="heroContainer">
    <client-only>
      <!-- Gradient Background -->
      <div class="gradient-canvas-container">
        <canvas ref="gradientCanvas"></canvas>
      </div>
      
      <!-- Content Container -->
      <div class="content-container" ref="contentContainer">
        <!-- Center image (optional) -->
        <div v-if="centerImage && centerImage.src" class="center-image" ref="centerImageEl">
          <img :src="centerImage.src" :alt="centerImage.alt || 'Center Image'" class="responsive-image" />
        </div>
        
        <!-- Text Content (fades in) -->
        <div class="text-content" ref="textContent">
          <h1 v-if="title" class="hero-title">{{ title }}</h1>
          <div v-if="text" class="hero-text" v-html="text"></div>
          <a v-if="linkUrl" :href="linkUrl" class="hero-link" target="_blank" rel="noopener noreferrer" >{{ linkText || 'Learn More' }}</a>
        </div>
      </div>
    </client-only>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { gsap } from 'gsap';
let THREE;
let dat;

// --- Props ---
const props = defineProps({
  centerImage: Object,
  title: String,
  text: String,
  linkUrl: String,
  linkText: String,
  fadeInDelay: { type: Number, default: 2 }
});

// --- Refs ---
const heroContainer = ref(null);
const contentContainer = ref(null);
const centerImageEl = ref(null);
const textContent = ref(null);

// --- Animation Control State ---
const animationParams = ref({
  animationSpeed: 0.087,
  flowSpeed: 3.0,
  flowIntensity: 0.095,
  colorSaturation: 1.6,
  colorShift: 1.3,
  vignette: 0.7,
  isAnimationPaused: false,
  color1: { r: 0.0, g: 0.0, b: 0.0 },  // Deep blue
  color2: { r: 0.0, g: 0.0, b: 0.0 },
  color3: { r: 0.0, g: 0.0, b: 0.0 },  // Pink
  color4: { r: 1.0, g: 1.0, b: 1.0 }   // Cyan
});

// --- Three.js Gradient State ---
const gradientCanvas = ref(null);
let scene, camera, renderer, geometry, material, mesh;
let animationFrameId = null;
let gui;

// --- Animation Control Functions ---
const updateAnimationSpeed = () => {
  if (material && material.uniforms.animationSpeed) {
    material.uniforms.animationSpeed.value = animationParams.value.animationSpeed;
  }
};

const updateFlowSpeed = () => {
  if (material && material.uniforms.flowSpeed) {
    material.uniforms.flowSpeed.value = animationParams.value.flowSpeed;
  }
};

const updateFlowIntensity = () => {
  if (material && material.uniforms.flowIntensity) {
    material.uniforms.flowIntensity.value = animationParams.value.flowIntensity;
  }
};

const updateColorSaturation = () => {
  if (material && material.uniforms.colorSaturation) {
    material.uniforms.colorSaturation.value = animationParams.value.colorSaturation;
  }
};

const updateColorShift = () => {
  if (material && material.uniforms.colorShift) {
    material.uniforms.colorShift.value = animationParams.value.colorShift;
  }
};

const updateVignette = () => {
  if (material && material.uniforms.vignette) {
    material.uniforms.vignette.value = animationParams.value.vignette;
  }
};

const updateColor1 = () => {
  if (material && material.uniforms.color1) {
    material.uniforms.color1.value.set(
      animationParams.value.color1.r,
      animationParams.value.color1.g,
      animationParams.value.color1.b
    );
  }
};

const updateColor2 = () => {
  if (material && material.uniforms.color2) {
    material.uniforms.color2.value.set(
      animationParams.value.color2.r,
      animationParams.value.color2.g,
      animationParams.value.color2.b
    );
  }
};

const updateColor3 = () => {
  if (material && material.uniforms.color3) {
    material.uniforms.color3.value.set(
      animationParams.value.color3.r,
      animationParams.value.color3.g,
      animationParams.value.color3.b
    );
  }
};

const updateColor4 = () => {
  if (material && material.uniforms.color4) {
    material.uniforms.color4.value.set(
      animationParams.value.color4.r,
      animationParams.value.color4.g,
      animationParams.value.color4.b
    );
  }
};

const toggleAnimation = () => {
  animationParams.value.isAnimationPaused = !animationParams.value.isAnimationPaused;
  if (animationParams.value.isAnimationPaused) {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } else {
    animate();
  }
};

const resetAnimation = () => {
  if (material && material.uniforms.time) {
    material.uniforms.time.value = 0;
  }
  animationParams.value.animationSpeed = 0.67;
  animationParams.value.flowSpeed = 3.0;
  animationParams.value.flowIntensity = 0.095;
  animationParams.value.colorSaturation = 1.6;
  animationParams.value.colorShift = 1.3;
  animationParams.value.vignette = 0.7;
  
  // Reset colors
  animationParams.value.color1 = { r: 0, g: 0, b: 0 };
  animationParams.value.color2 = { r: 0, g: 0, b: 0};
  animationParams.value.color3 = { r: 0, g: 0, b: 0 };
  animationParams.value.color4 = { r: 1.0, g: 1.0, b: 1.0 };
  
  // Update all uniforms
  updateAnimationSpeed();
  updateFlowSpeed();
  updateFlowIntensity();
  updateColorSaturation();
  updateColorShift();
  updateVignette();
  updateColor1();
  updateColor2();
  updateColor3();
  updateColor4();
  
  // Update GUI values
  if (gui) {
    gui.updateDisplay();
  }
};

// --- Three.js Gradient Background ---
const initThree = () => {
  if (!process.client || !gradientCanvas.value) return;
  if (!THREE) return;
  
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ 
    canvas: gradientCanvas.value, 
    alpha: true,
    antialias: true 
  });
  renderer.setSize(gradientCanvas.value.offsetWidth, gradientCanvas.value.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Geometry
  geometry = new THREE.PlaneGeometry(2, 2);
  
  // Shader material with enhanced gradient
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform float time;
    uniform float animationSpeed;
    uniform float flowSpeed;
    uniform float flowIntensity;
    uniform float colorSaturation;
    uniform float colorShift;
    uniform float vignette;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 color4;
    varying vec2 vUv;
    
    // Noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // Smooth noise
    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    // Fractal noise
    float fractalNoise(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for(int i = 0; i < 4; i++) {
        value += amplitude * smoothNoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    // Iridescent effect
    void main() {
      vec2 uv = vUv;
      
      // Create flowing animation for the UV coordinates with adjustable speed
      vec2 animatedUV = uv + vec2(
        sin(time * animationSpeed * flowSpeed * 0.2 + uv.y * 4.0) * flowIntensity,
        cos(time * animationSpeed * flowSpeed * 0.1 + uv.x * 3.0) * flowIntensity
      );
      
      // Create multiple layers of noise with different frequencies
      float noise1 = fractalNoise(animatedUV * 3.0 + time * animationSpeed * 0.1);
      float noise2 = fractalNoise(animatedUV * 6.0 + time * animationSpeed * 0.15);
      float noise3 = fractalNoise(animatedUV * 12.0 + time * animationSpeed * 0.2);
      
      // Combine noise layers for texture
      float noisePattern = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
      
      // Create base gradient
      float gradient = smoothstep(0.0, 1.0, uv.y + noisePattern * 0.3);
      
      // Create iridescent effect by mixing colors based on noise and time with color shift control
      float t1 = sin(time * animationSpeed * 0.3 * colorShift + noisePattern * 5.0) * 0.5 + 0.5;
      float t2 = cos(time * animationSpeed * 0.2 * colorShift + noisePattern * 3.0) * 0.5 + 0.5;
      
      // Mix colors based on noise and time
      vec3 iridColor1 = mix(color1, color2, t1);
      vec3 iridColor2 = mix(color3, color4, t2);
      vec3 baseColor = mix(iridColor1, iridColor2, gradient);
      
      // Add highlights
      float highlight = pow(noisePattern, 3.0) * 0.8;
      vec3 highlightColor = vec3(0.9, 0.95, 1.0);
      baseColor = mix(baseColor, highlightColor, highlight * 0.4);
      
      // Add depth with darker areas
      float depth = 1.0 - noisePattern * 0.3;
      baseColor *= depth;
      
      // Add subtle color variation
      baseColor += vec3(0.05, 0.1, 0.15) * noisePattern * 0.2;
      
      // Apply color saturation
      vec3 luminance = vec3(dot(baseColor, vec3(0.299, 0.587, 0.114)));
      baseColor = mix(luminance, baseColor, colorSaturation);
      
      // Add adjustable vignette effect
      float vignetteEffect = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5) * vignette * 1.5);
      baseColor *= vignetteEffect * 1.1;
      
      gl_FragColor = vec4(baseColor, 1.0);
    }
  `;
  
  // Create material with enhanced uniforms
  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0 },
      animationSpeed: { value: animationParams.value.animationSpeed },
      flowSpeed: { value: animationParams.value.flowSpeed },
      flowIntensity: { value: animationParams.value.flowIntensity },
      colorSaturation: { value: animationParams.value.colorSaturation },
      colorShift: { value: animationParams.value.colorShift },
      vignette: { value: animationParams.value.vignette },
      color1: { value: new THREE.Color(animationParams.value.color1.r, animationParams.value.color1.g, animationParams.value.color1.b) },
      color2: { value: new THREE.Color(animationParams.value.color2.r, animationParams.value.color2.g, animationParams.value.color2.b) },
      color3: { value: new THREE.Color(animationParams.value.color3.r, animationParams.value.color3.g, animationParams.value.color3.b) },
      color4: { value: new THREE.Color(animationParams.value.color4.r, animationParams.value.color4.g, animationParams.value.color4.b) }
    }
  });
  
  // Create mesh
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  
  // Start animation
  animate();
  
  // Add resize listener
  window.addEventListener('resize', onWindowResize);
};

const animate = () => {
  if (!material || animationParams.value.isAnimationPaused) return;
  material.uniforms.time.value += animationParams.value.animationSpeed;
  renderer.render(scene, camera);
  animationFrameId = requestAnimationFrame(animate);
};

const onWindowResize = () => {
  if (!gradientCanvas.value || !renderer || !camera) return;
  camera.aspect = gradientCanvas.value.offsetWidth / gradientCanvas.value.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(gradientCanvas.value.offsetWidth, gradientCanvas.value.offsetHeight);
};

// --- dat.GUI Setup with Enhanced Controls ---
const initDatGUI = () => {
  // Only load dat.GUI in development mode
  if (!process.client || !dat || process.env.NODE_ENV !== 'development') return;
  
  gui = new dat.GUI({ autoPlace: false });
  
  // Position GUI in bottom left
  const guiContainer = gui.domElement;
  guiContainer.style.position = 'fixed';
  guiContainer.style.bottom = '20px';
  guiContainer.style.left = '20px';
  guiContainer.style.zIndex = '1000';
  document.body.appendChild(guiContainer);
  
  // Add animation controls
  const animationFolder = gui.addFolder('Animation Controls');
  
  animationFolder.add(animationParams.value, 'animationSpeed', 0, 0.1, 0.001)
    .name('Animation Speed')
    .onChange(updateAnimationSpeed);
    
  animationFolder.add(animationParams.value, 'flowSpeed', 0.1, 3, 0.1)
    .name('Flow Speed')
    .onChange(updateFlowSpeed);
  
  animationFolder.add(animationParams.value, 'flowIntensity', 0, 0.1, 0.001)
    .name('Flow Intensity')
    .onChange(updateFlowIntensity);
    
  animationFolder.add(animationParams.value, 'colorShift', 0, 2, 0.1)
    .name('Color Shift')
    .onChange(updateColorShift);
  
  animationFolder.add(animationParams.value, 'isAnimationPaused')
    .name('Pause Animation')
    .onChange(toggleAnimation);
  
  // Add color controls
  const colorFolder = gui.addFolder('Color Controls');
  
  colorFolder.add(animationParams.value, 'colorSaturation', 0.5, 3, 0.1)
    .name('Color Saturation')
    .onChange(updateColorSaturation);
    
  colorFolder.add(animationParams.value, 'vignette', 0, 2, 0.1)
    .name('Vignette')
    .onChange(updateVignette);
  
  // Color 1 controls
  const color1Folder = colorFolder.addFolder('Color 1 (Deep Blue)');
  color1Folder.add(animationParams.value.color1, 'r', 0, 1, 0.01).name('Red').onChange(updateColor1);
  color1Folder.add(animationParams.value.color1, 'g', 0, 1, 0.01).name('Green').onChange(updateColor1);
  color1Folder.add(animationParams.value.color1, 'b', 0, 1, 0.01).name('Blue').onChange(updateColor1);
  
  // Color 2 controls
  const color2Folder = colorFolder.addFolder('Color 2 (Purple)');
  color2Folder.add(animationParams.value.color2, 'r', 0, 1, 0.01).name('Red').onChange(updateColor2);
  color2Folder.add(animationParams.value.color2, 'g', 0, 1, 0.01).name('Green').onChange(updateColor2);
  color2Folder.add(animationParams.value.color2, 'b', 0, 1, 0.01).name('Blue').onChange(updateColor2);
  
  // Color 3 controls
  const color3Folder = colorFolder.addFolder('Color 3 (Pink)');
  color3Folder.add(animationParams.value.color3, 'r', 0, 1, 0.01).name('Red').onChange(updateColor3);
  color3Folder.add(animationParams.value.color3, 'g', 0, 1, 0.01).name('Green').onChange(updateColor3);
  color3Folder.add(animationParams.value.color3, 'b', 0, 1, 0.01).name('Blue').onChange(updateColor3);
  
  // Color 4 controls
  const color4Folder = colorFolder.addFolder('Color 4 (Cyan)');
  color4Folder.add(animationParams.value.color4, 'r', 0, 1, 0.01).name('Red').onChange(updateColor4);
  color4Folder.add(animationParams.value.color4, 'g', 0, 1, 0.01).name('Green').onChange(updateColor4);
  color4Folder.add(animationParams.value.color4, 'b', 0, 1, 0.01).name('Blue').onChange(updateColor4);
  
  // Reset button
  gui.add({ reset: resetAnimation }, 'reset')
    .name('Reset All');
  
  animationFolder.open();
};

// --- Mount Logic ---
onMounted(async () => {
  // Dynamic import Three.js and dat.GUI
  if (process.client) {
    const threeModule = await import('three');
    THREE = threeModule;
    
    // Only load dat.GUI in development mode
    if (process.env.NODE_ENV === 'development') {
      const datModule = await import('dat.gui');
      dat = datModule.default;
    }
    
    nextTick(() => {
      initThree();
      initDatGUI();
    });
    
    // Fade in text content after delay
    if (textContent.value) {
      // Initially hide the text content
      gsap.set(textContent.value, { opacity: 0, y: 30 });
      
      // Fade in after specified delay
      gsap.to(textContent.value, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power2.out",
        delay: props.fadeInDelay
      });
    }
  }
});

onBeforeUnmount(() => {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', onWindowResize);
  if (geometry) geometry.dispose();
  if (material) material.dispose();
  if (renderer) renderer.dispose();
  if (gui) {
    gui.destroy();
  }
});
</script>

<style lang="scss">
.builder-hero-explosion {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 100svh;
  max-height: 100svh;
  overflow: hidden;

  .gradient-canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
    }
  }

  .content-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    z-index: 10;
  }

  .center-image {
    position: relative;
    width: 50%;
    max-width: 350px;
    margin: 0 auto 2rem;
    
    img {
      width: 100%;
      height: auto;
      object-fit: cover;
    }
    
    @media (max-width: 900px) {
      width: 70%;
      max-width: 250px;
    }
    
    @media (max-width: 600px) {
      width: 90%;
      max-width: 180px;
    }
  }
  
  .text-content {
    text-align: center;
    color: white;
    padding: 2rem;
    max-width: 800px;
    z-index: 20;
    
    .hero-title {
      font-family: $poppins-extra-bold;
      font-size: 4rem;
      margin-bottom: 1.5rem;
      line-height: 1.1;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      
      @media (max-width: 768px) {
        font-size: 2.5rem;
      }
    }
    
    .hero-text {
      font-family: $poppins;
      font-size: 1.5rem;
      line-height: 1.5;
      margin-bottom: 2rem;
      text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
      
      @media (max-width: 768px) {
        font-size: 1.2rem;
      }
    }
    
    .hero-link {
      display: inline-block;
      font-family: $poppins-semi-bold;
      font-size: 1.2rem;
      background-color: white;
      color: black;
      padding: 0.8rem 2rem;
      border-radius: 50px;
      text-decoration: none;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
      }
      
      @media (max-width: 768px) {
        font-size: 1rem;
        padding: 0.6rem 1.5rem;
      }
    }
  }
}
</style> 