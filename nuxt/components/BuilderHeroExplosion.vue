<template>
  <section class="builder-hero-explosion pad-bl" ref="heroContainer">
    <client-only>
      <!-- Gradient Background -->
      <div class="gradient-canvas-container">
        <canvas ref="gradientCanvas"></canvas>
      </div>
      
      <!-- Explosion Container -->
      <div class="explosion-container" ref="explosionContainer" @click="resetAllMedia">
        <!-- Center image -->
        <div 
          class="center-image" 
          ref="centerImageEl" 
          @click.stop="bringToCenter($event, 'center')"
          :class="{ 'centered': centeredMediaIndex === 'center' }"
        >
          <img v-if="centerImage && centerImage.src" :src="centerImage.src" :alt="centerImage.alt || 'Center Image'" class="responsive-image" />
        </div>
        <!-- Explosion media (combined images and videos) -->
        <template v-if="combinedMedia.length > 0">
          <template v-for="(item, index) in combinedMedia">
            <div 
              v-if="item.type === 'image'" 
              :key="`img-${index}`" 
              class="explosion-media explosion-image" 
              :ref="setExplosionMediaRef(index)" 
              @click.stop="bringToCenter($event, index)"
              :class="{ 'centered': centeredMediaIndex === index }"
            >
              <img v-if="item.src" :src="item.src" :alt="item.alt || `Explosion Image ${index + 1}`" class="responsive-image" />
            </div>
            <div 
              v-if="item.type === 'video'" 
              :key="`vid-${index}`" 
              class="explosion-media explosion-video" 
              :ref="setExplosionMediaRef(index)" 
              @click.stop="bringToCenter($event, index)"
              :class="{ 'centered': centeredMediaIndex === index }"
            >
              <video v-if="item.src" :src="item.src" autoplay muted playsinline class="responsive-video"></video>
            </div>
          </template>
        </template>
        <div v-else style="color: red; text-align: center; margin-top: 2rem;">
          No explosion media found. Check if explosionImages or explosionVideos are being passed as props.
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
  explosionImages: { type: Array, default: () => [] },
  explosionVideos: { type: Array, default: () => [] },
  animationDuration: { type: Number, default: 1.5 },
  staggerDelay: { type: Number, default: 0.05 },
});

// --- Explosion State ---
const explosionContainer = ref(null);
const centerImageEl = ref(null);
const explosionMediaRefs = ref([]);
const combinedMedia = ref([]);

// --- Click Interaction State ---
const originalPositions = ref(new Map());
const isAnyMediaCentered = ref(false);
const centeredMediaIndex = ref(null);

// --- Animation Control State ---
const animationParams = ref({
  animationSpeed: 0.02,
  waterIntensity: 0.01,
  colorSaturation: 1.0,
  isAnimationPaused: false
});

// --- Three.js Gradient State ---
const gradientCanvas = ref(null);
let scene, camera, renderer, geometry, material, mesh;
let animationFrameId = null;
let gui;

// --- Helper: Collect explosion media refs robustly ---
function setExplosionMediaRef(index) {
  return (el) => {
    if (el) explosionMediaRefs.value[index] = el;
  };
}

// --- Helper: Shuffle array ---
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// --- Animation Control Functions ---
const updateAnimationSpeed = () => {
  if (material && material.uniforms.animationSpeed) {
    material.uniforms.animationSpeed.value = animationParams.value.animationSpeed;
  }
};

const updateWaterIntensity = () => {
  if (material && material.uniforms.waterIntensity) {
    material.uniforms.waterIntensity.value = animationParams.value.waterIntensity;
  }
};

const updateColorSaturation = () => {
  if (material && material.uniforms.colorSaturation) {
    material.uniforms.colorSaturation.value = animationParams.value.colorSaturation;
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
  animationParams.value.animationSpeed = 0.02;
  animationParams.value.waterIntensity = 0.01;
  animationParams.value.colorSaturation = 1.0;
  updateAnimationSpeed();
  updateWaterIntensity();
  updateColorSaturation();
  
  // Update GUI values
  if (gui) {
    gui.updateDisplay();
  }
};

// --- Click Interaction Functions ---
const bringToCenter = (event, index) => {
  if (!process.client) return;
  
  const targetElement = index === 'center' ? centerImageEl.value : explosionMediaRefs.value[index];
  if (!targetElement) return;
  
  // If this element is already centered, reset it
  if (centeredMediaIndex.value === index) {
    resetToOriginalPosition(index);
    return;
  }
  
  // Store original position if not already stored
  if (!originalPositions.value.has(index)) {
    const rect = targetElement.getBoundingClientRect();
    const containerRect = explosionContainer.value.getBoundingClientRect();
    originalPositions.value.set(index, {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
      scale: gsap.getProperty(targetElement, 'scale') || 1
    });
  }
  
  // Reset any previously centered media
  if (isAnyMediaCentered.value && centeredMediaIndex.value !== null) {
    resetToOriginalPosition(centeredMediaIndex.value);
  }
  
  // Animate to center with linear easing
  gsap.to(targetElement, {
    x: 0,
    y: 0,
    scale: 1.2,
    duration: 0.8,
    ease: "none", // Linear transition
    onComplete: () => {
      isAnyMediaCentered.value = true;
      centeredMediaIndex.value = index;
    }
  });
};

const resetToOriginalPosition = (index) => {
  const targetElement = index === 'center' ? centerImageEl.value : explosionMediaRefs.value[index];
  if (!targetElement || !originalPositions.value.has(index)) return;
  
  const position = originalPositions.value.get(index);
  
  gsap.to(targetElement, {
    x: position.x,
    y: position.y,
    scale: position.scale,
    duration: 0.6,
    ease: "none", // Linear transition
    onComplete: () => {
      if (centeredMediaIndex.value === index) {
        isAnyMediaCentered.value = false;
        centeredMediaIndex.value = null;
      }
    }
  });
};

const resetAllMedia = () => {
  if (!isAnyMediaCentered.value) return;
  
  // Reset all media to their original positions
  originalPositions.value.forEach((position, index) => {
    resetToOriginalPosition(index);
  });
  
  // Reset center image if it was centered
  if (centeredMediaIndex.value === 'center' && centerImageEl.value) {
    gsap.to(centerImageEl.value, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: "none"
    });
  }
  
  isAnyMediaCentered.value = false;
  centeredMediaIndex.value = null;
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
  
  // Shader material with watery glossy gradient
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
    uniform float waterIntensity;
    uniform float colorSaturation;
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
    
    // Watery glossy effect
    void main() {
      vec2 uv = vUv;
      
      // Animate the UV coordinates for flowing water effect
      vec2 animatedUV = uv + vec2(
        sin(time * animationSpeed * 0.3 + uv.y * 3.0) * waterIntensity,
        cos(time * animationSpeed * 0.2 + uv.x * 2.0) * waterIntensity
      );
      
      // Create multiple layers of noise for depth
      float noise1 = fractalNoise(animatedUV * 2.0 + time * animationSpeed * 0.1);
      float noise2 = fractalNoise(animatedUV * 4.0 + time * animationSpeed * 0.15);
      float noise3 = fractalNoise(animatedUV * 8.0 + time * animationSpeed * 0.2);
      
      // Combine noise layers for watery texture
      float waterNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
      
      // Create glossy gradient with water effect
      float gradient = uv.x + waterNoise * 0.3;
      gradient = smoothstep(0.0, 1.0, gradient);
      
      // Watery glossy colors (deep blue to light cyan)
      vec3 deepBlue = vec3(0.1, 0.3, 0.8);
      vec3 lightCyan = vec3(0.4, 0.8, 1.0);
      vec3 glossyWhite = vec3(0.9, 0.95, 1.0);
      
      // Mix colors based on gradient and noise
      vec3 baseColor = mix(deepBlue, lightCyan, gradient);
      
      // Add glossy highlights
      float highlight = pow(waterNoise, 2.0) * 0.8;
      baseColor = mix(baseColor, glossyWhite, highlight * 0.3);
      
      // Add depth with darker areas
      float depth = 1.0 - waterNoise * 0.2;
      baseColor *= depth;
      
      // Add subtle color variation
      baseColor += vec3(0.1, 0.2, 0.3) * waterNoise * 0.1;
      
      // Apply color saturation
      baseColor = mix(vec3(dot(baseColor, vec3(0.299, 0.587, 0.114))), baseColor, colorSaturation);
      
      gl_FragColor = vec4(baseColor, 1.0);
    }
  `;
  
  // Create material with uniforms
  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0 },
      animationSpeed: { value: animationParams.value.animationSpeed },
      waterIntensity: { value: animationParams.value.waterIntensity },
      colorSaturation: { value: animationParams.value.colorSaturation }
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

// --- dat.GUI Setup ---
const initDatGUI = () => {
  if (!process.client || !dat) return;
  
  gui = new dat.GUI({ autoPlace: false });
  
  // Position GUI in bottom left
  const guiContainer = gui.domElement;
  guiContainer.style.position = 'fixed';
  guiContainer.style.bottom = '20px';
  guiContainer.style.left = '20px';
  guiContainer.style.zIndex = '1000';
  document.body.appendChild(guiContainer);
  
  // Add controls
  const animationFolder = gui.addFolder('Background Animation');
  
  animationFolder.add(animationParams.value, 'animationSpeed', 0, 0.1, 0.001)
    .name('Animation Speed')
    .onChange(updateAnimationSpeed);
  
  animationFolder.add(animationParams.value, 'waterIntensity', 0, 0.05, 0.001)
    .name('Water Intensity')
    .onChange(updateWaterIntensity);
  
  animationFolder.add(animationParams.value, 'colorSaturation', 0.5, 2, 0.1)
    .name('Color Saturation')
    .onChange(updateColorSaturation);
  
  animationFolder.add(animationParams.value, 'isAnimationPaused')
    .name('Pause Animation')
    .onChange(toggleAnimation);
  
  animationFolder.add({ reset: resetAnimation }, 'reset')
    .name('Reset Animation');
  
  animationFolder.open();
};

// --- Explosion Animation ---
let timeline = null;

// --- Mount Logic ---
onMounted(async () => {
  // Prepare explosion media
  const validImages = (props.explosionImages || []).filter(img => img && img.src).map(img => ({ ...img, type: 'image' }));
  const validVideos = (props.explosionVideos || []).filter(vid => vid && vid.src).map(vid => ({ ...vid, type: 'video' }));
  combinedMedia.value = shuffleArray([...validImages, ...validVideos]);

  // Dynamic import Three.js and dat.GUI
  if (process.client) {
    const threeModule = await import('three');
    THREE = threeModule;
    
    const datModule = await import('dat.gui');
    dat = datModule.default;
    
    nextTick(() => {
      initThree();
      initDatGUI();
    });
  }

  // Explosion animation logic (after DOM update)
  nextTick(() => {
    if (combinedMedia.value.length > 0 && explosionMediaRefs.value.length > 0) {
      if (timeline) timeline.kill();
      timeline = gsap.timeline({
        paused: true
      });
      
      const containerWidth = explosionContainer.value.offsetWidth;
      const containerHeight = explosionContainer.value.offsetHeight;
      const maxX = containerWidth * 0.45;
      const maxY = containerHeight * 0.45;
      const placedItems = [];
      
      const checkOverlap = (newX, newY, newScale, mediaEl) => {
        const elWidth = mediaEl.offsetWidth * newScale;
        const elHeight = mediaEl.offsetHeight * newScale;
        if (!elWidth || !elHeight) return true;
        const maxOverlapPercent = 0.15;
        const itemArea = elWidth * elHeight;
        const maxOverlapArea = itemArea * maxOverlapPercent;
        for (const item of placedItems) {
          const overlapWidth = Math.max(0, Math.min(newX + elWidth/2, item.x + item.width/2) - Math.max(newX - elWidth/2, item.x - item.width/2));
          const overlapHeight = Math.max(0, Math.min(newY + elHeight/2, item.y + item.height/2) - Math.max(newY - elHeight/2, item.y - item.height/2));
          const overlapArea = overlapWidth * overlapHeight;
          if (overlapArea > maxOverlapArea) return false;
        }
        return true;
      };
      
      const getQuadrantPosition = (quadrant, mediaEl) => {
        const quadrantAngles = {
          topLeft: { min: Math.PI * 0.75, max: Math.PI * 1.25 },
          topRight: { min: Math.PI * 0.25, max: Math.PI * 0.75 },
          bottomRight: { min: -Math.PI * 0.25, max: Math.PI * 0.25 },
          bottomLeft: { min: Math.PI * 1.25, max: Math.PI * 1.75 }
        };
        const angles = quadrantAngles[quadrant];
        for (let attempt = 0; attempt < 10; attempt++) {
          const angle = angles.min + Math.random() * (angles.max - angles.min);
          const distanceFactor = 0.4 + Math.random() * 0.6;
          const x = Math.cos(angle) * maxX * distanceFactor;
          const y = Math.sin(angle) * maxY * distanceFactor;
          const scale = 0.3 + Math.random() * 0.7;
          if (checkOverlap(x, y, scale, mediaEl)) {
            placedItems.push({ x, y, width: mediaEl.offsetWidth * scale, height: mediaEl.offsetHeight * scale });
            return { x, y, scale };
          }
        }
        const angle = angles.min + Math.random() * (angles.max - angles.min);
        const distanceFactor = 0.4 + Math.random() * 0.6;
        const x = Math.cos(angle) * maxX * distanceFactor;
        const y = Math.sin(angle) * maxY * distanceFactor;
        const scale = 0.3 + Math.random() * 0.7;
        placedItems.push({ x, y, width: mediaEl.offsetWidth * scale, height: mediaEl.offsetHeight * scale });
        return { x, y, scale };
      };
      
      const quadrants = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
      explosionMediaRefs.value.forEach((mediaEl, index) => {
        gsap.set(mediaEl, { x: 0, y: 0, scale: 0.5, opacity: 0 });
      });
      
      explosionMediaRefs.value.forEach((mediaEl, index) => {
        const quadrant = quadrants[index % quadrants.length];
        const { x, y, scale } = getQuadrantPosition(quadrant, mediaEl);
        timeline.to(mediaEl, { x, y, scale, opacity: 1, duration: props.animationDuration, ease: "none" }, index * props.staggerDelay);
      });
      
      timeline.play();
    }
  });
});

onBeforeUnmount(() => {
  if (timeline) timeline.kill();
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
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;

  .gradient-canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
    pointer-events: none;
    canvas {
      width: 100vw !important;
      height: 100vh !important;
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
    }
  }

  .explosion-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    z-index: 10;
    cursor: pointer;
  }

  .center-image {
    position: relative;
    width: 50%;
    max-width: 350px;
    z-index: 12;
    margin: 0 auto;
    cursor: pointer;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
    }
    
    &.centered {
      z-index: 20;
    }
  }

  .explosion-media {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50%;
    max-width: 450px;
    z-index: 11;
    will-change: transform, opacity;
    cursor: pointer;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: translate(-50%, -50%) scale(1.05);
    }
    
    &.centered {
      z-index: 20;
    }
  }
  
  .explosion-video {
    overflow: hidden;
  }
  
  img, video {
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  // Responsive styles
  @media (max-width: 900px) {
    .center-image {
      width: 70%;
      max-width: 250px;
    }
    .explosion-media {
      width: 70%;
      max-width: 300px;
    }
  }
  
  @media (max-width: 600px) {
    .center-image {
      width: 90%;
      max-width: 180px;
    }
    .explosion-media {
      width: 90%;
      max-width: 180px;
    }
  }
}
</style> 