<template>
  <section class="builder-gradient-text" ref="gradientContainer">
    <client-only>
      <div class="gradient-overlay" ref="gradientOverlay" v-show="showGradient">
        <div class="gradient-content" v-show="showContent">
          <h1 class="gradient-title">{{ title }}</h1>
          <p class="gradient-description">{{ description }}</p>
          <a :href="linkUrl" class="gradient-link">{{ linkText }}</a>
        </div>
        <div class="gradient-canvas-container">
          <canvas ref="gradientCanvas"></canvas>
        </div>
        <div class="gui-container" ref="guiContainer"></div>
      </div>
    </client-only>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { gsap } from 'gsap';

// Import Three.js and dat.gui only on client-side
let THREE, GUI;
if (process.client) {
  console.log('BuilderGradientText: Starting dynamic imports');
  // Use dynamic imports instead of require
  Promise.all([
    import('three'),
    import('dat.gui')
  ]).then(([threeModule, datGuiModule]) => {
    console.log('BuilderGradientText: Dynamic imports completed successfully');
    THREE = threeModule;
    GUI = datGuiModule.GUI;
    // Initialize Three.js after imports are complete
    initThree();
    
    // Ensure gradient is visible after Three.js is initialized
    nextTick(() => {
      console.log('BuilderGradientText: nextTick after Three.js init, ensuring gradient is visible');
      showGradientBackground();
    });
  }).catch(error => {
    console.error('Error importing client-side libraries:', error);
  });
}

const props = defineProps({
  title: {
    type: String,
    default: 'Gradient Title'
  },
  description: {
    type: String,
    default: 'This is a gradient description text.'
  },
  linkText: {
    type: String,
    default: 'Visit Website'
  },
  linkUrl: {
    type: String,
    default: '#'
  },
  gradientStartColor: {
    type: String,
    default: '#0000ff' // Blue
  },
  gradientEndColor: {
    type: String,
    default: '#ff0000' // Red
  },
  animationDuration: {
    type: Number,
    default: 10
  },
  initiallyShowContent: {
    type: Boolean,
    default: false
  }
});

const gradientContainer = ref(null);
const gradientCanvas = ref(null);
const gradientOverlay = ref(null);
const guiContainer = ref(null);
const showGradient = ref(false);
const showContent = ref(false);

// Three.js variables
let scene, camera, renderer, geometry, material, mesh;
let animationFrameId = null;
let gui = null;

// Gradient settings
const gradientSettings = ref({
  startColor: props.gradientStartColor,
  endColor: props.gradientEndColor,
  animationSpeed: 0.15, // Increased default animation speed
  noiseIntensity: 0.55, // Increased default noise intensity
  noiseScale: 0.5 // Increased default noise scale
});

// Initialize Three.js scene
const initThree = () => {
  // Only initialize Three.js on client-side
  if (!process.client) return;
  
  if (!gradientCanvas.value) {
    console.error('BuilderGradientText: Canvas element not found');
    return;
  }
  
  console.log('BuilderGradientText: Initializing Three.js scene');
  
  try {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
      75, 
      gradientCanvas.value.offsetWidth / gradientCanvas.value.offsetHeight, 
      0.1, 
      1000
    );
    camera.position.z = 1;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
      canvas: gradientCanvas.value,
      alpha: true,
      antialias: true
    });
    renderer.setSize(gradientCanvas.value.offsetWidth, gradientCanvas.value.offsetHeight);
    
    // Create gradient material with shader
  const vertexShader = `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform float time;
    uniform float noiseIntensity;
    uniform float noiseScale;
    varying vec2 vUv;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      // Create animated noise
      vec2 scaledUv = vUv * noiseScale;
      float noise = snoise(scaledUv + time * 0.1) * noiseIntensity;
      
      // Create gradient with noise
      vec3 color = mix(colorA, colorB, vUv.x + noise);
      
      // Output final color
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  
  // Create material with custom shaders
  material = new THREE.ShaderMaterial({
    uniforms: {
      colorA: { value: new THREE.Color(gradientSettings.value.startColor) },
      colorB: { value: new THREE.Color(gradientSettings.value.endColor) },
      time: { value: 0 },
      noiseIntensity: { value: gradientSettings.value.noiseIntensity },
      noiseScale: { value: gradientSettings.value.noiseScale }
    },
    vertexShader,
    fragmentShader
  });
  
  console.log('Material created with uniforms:', {
    colorA: gradientSettings.value.startColor,
    colorB: gradientSettings.value.endColor,
    noiseIntensity: gradientSettings.value.noiseIntensity,
    noiseScale: gradientSettings.value.noiseScale
  });
  
  // Create plane geometry that fills the screen
  geometry = new THREE.PlaneGeometry(2, 2);
  
    // Create mesh
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Start animation loop
    animate();
    
    // Initialize GUI
    initGUI();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
  } catch (error) {
    console.error('Error initializing Three.js:', error);
  }
};

// Animation loop
const animate = () => {
  if (!material) return;
  
  // Update time uniform for animation - quadrupled speed and amount
  material.uniforms.time.value += 0.04 * gradientSettings.value.animationSpeed;
  
  // Render scene
  renderer.render(scene, camera);
  
  // Request next frame
  animationFrameId = requestAnimationFrame(animate);
};

// Initialize dat.GUI
const initGUI = () => {
  if (!guiContainer.value) {
    console.error('BuilderGradientText: GUI container element not found');
    return;
  }
  
  // Only initialize GUI on client-side
  if (!process.client) return;
  
  console.log('BuilderGradientText: Initializing dat.GUI');
  
  try {
    // Create GUI
    gui = new GUI({ autoPlace: false });
    guiContainer.value.appendChild(gui.domElement);
    
    // Add color controls
    const colorFolder = gui.addFolder('Colors');
    colorFolder.addColor(gradientSettings.value, 'startColor').onChange(value => {
      if (material && material.uniforms) {
        console.log('GUI: Updating start color to', value);
        material.uniforms.colorA.value.set(value);
      }
    });
    colorFolder.addColor(gradientSettings.value, 'endColor').onChange(value => {
      if (material && material.uniforms) {
        console.log('GUI: Updating end color to', value);
        material.uniforms.colorB.value.set(value);
      }
    });
    colorFolder.open();
    
    // Add animation controls
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(gradientSettings.value, 'animationSpeed', 0, 4).step(0.1).onChange(value => {
      // This ensures the animation speed change takes effect immediately
      console.log('GUI: Animation speed changed to:', value);
      // No need to update material uniforms here as the animate() function
      // uses gradientSettings.value.animationSpeed directly
    });
    animationFolder.add(gradientSettings.value, 'noiseIntensity', 0, 2).step(0.05).onChange(value => {
      if (material && material.uniforms) {
        console.log('GUI: Noise intensity changed to:', value);
        material.uniforms.noiseIntensity.value = value;
      }
    });
    animationFolder.add(gradientSettings.value, 'noiseScale', 0.1, 10).step(0.1).onChange(value => {
      if (material && material.uniforms) {
        console.log('GUI: Noise scale changed to:', value);
        material.uniforms.noiseScale.value = value;
      }
    });
    animationFolder.open();
    
    // Make GUI visible by default so users can interact with it
    gui.open();
  } catch (error) {
    console.error('Error initializing GUI:', error);
  }
};

// Handle window resize
const onWindowResize = () => {
  if (!gradientCanvas.value || !renderer || !camera) return;
  
  // Update camera aspect ratio
  camera.aspect = gradientCanvas.value.offsetWidth / gradientCanvas.value.offsetHeight;
  camera.updateProjectionMatrix();
  
  // Update renderer size
  renderer.setSize(gradientCanvas.value.offsetWidth, gradientCanvas.value.offsetHeight);
};

// Show gradient background only
const showGradientBackground = () => {
  if (!process.client) return;
  
  console.log('BuilderGradientText: showGradientBackground called');
  
  // Ensure we're in a client context with all required elements
  if (!gradientOverlay.value) {
    console.log('BuilderGradientText: gradientOverlay not available yet');
    // Try again after a short delay
    setTimeout(() => {
      console.log('BuilderGradientText: Retrying showGradientBackground');
      if (gradientOverlay.value) {
        console.log('BuilderGradientText: gradientOverlay now available');
        showGradient.value = true;
      } else {
        console.error('BuilderGradientText: gradientOverlay still not available after retry');
      }
    }, 500);
    return;
  }
  
  console.log('BuilderGradientText: Setting showGradient to true');
  showGradient.value = true;
};

// Show text content with animation
const showTextContent = () => {
  if (!process.client) return;
  
  console.log('BuilderGradientText: showTextContent called');
  
  // Ensure we're in a client context with all required elements
  if (!gradientOverlay.value) {
    console.log('BuilderGradientText: gradientOverlay not available yet');
    return;
  }
  
  showContent.value = true;
  
  try {
    console.log('BuilderGradientText: Starting content fade-in animation');
    
    // Animate content
    const contentElements = gradientOverlay.value.querySelectorAll('.gradient-title, .gradient-description, .gradient-link');
    console.log('BuilderGradientText: Animating', contentElements.length, 'content elements');
    
    gsap.fromTo(
      contentElements,
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 1, 
        stagger: 0.2, 
        ease: "power2.out", 
        onComplete: () => console.log('BuilderGradientText: Content animation complete')
      }
    );
  } catch (error) {
    console.error('Error showing content animation:', error);
  }
};

// Show gradient with animation (combined function for backward compatibility)
const showGradientWithAnimation = () => {
  if (!process.client) return;
  
  console.log('BuilderGradientText: showGradientWithAnimation called');
  
  // Show gradient background first
  showGradientBackground();
  
  // Then show text content
  showTextContent();
};

// Clean up resources
const cleanup = () => {
  // Stop animation loop
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Remove event listeners
  window.removeEventListener('resize', onWindowResize);
  
  // Dispose Three.js resources
  if (geometry) geometry.dispose();
  if (material) material.dispose();
  if (renderer) renderer.dispose();
  
  // Dispose GUI
  if (gui) gui.destroy();
};

// Watch for prop changes
watch(() => props.gradientStartColor, (newValue) => {
  console.log('Prop gradientStartColor changed to:', newValue);
  gradientSettings.value.startColor = newValue;
  if (material && material.uniforms) {
    console.log('Updating material uniform colorA to:', newValue);
    material.uniforms.colorA.value.set(newValue);
  }
});

watch(() => props.gradientEndColor, (newValue) => {
  console.log('Prop gradientEndColor changed to:', newValue);
  gradientSettings.value.endColor = newValue;
  if (material && material.uniforms) {
    console.log('Updating material uniform colorB to:', newValue);
    material.uniforms.colorB.value.set(newValue);
  }
});

watch(() => props.animationDuration, (newValue) => {
  console.log('Prop animationDuration changed to:', newValue);
  // Convert animationDuration to animationSpeed (inverse relationship)
  // Lower duration = higher speed
  if (newValue > 0) {
    const newSpeed = 10 / newValue; // Scale factor to convert duration to speed
    console.log('Calculated animation speed:', newSpeed);
    gradientSettings.value.animationSpeed = newSpeed;
  }
});

// Lifecycle hooks
onMounted(() => {
  // Only run on client-side
  if (!process.client) return;
  
  console.log('BuilderGradientText mounted with props:', JSON.stringify({
    title: props.title,
    description: props.description?.substring(0, 30) + '...',
    linkText: props.linkText,
    gradientStartColor: props.gradientStartColor,
    gradientEndColor: props.gradientEndColor,
    animationDuration: props.animationDuration,
    initiallyShowContent: props.initiallyShowContent
  }));
  
  // Ensure the component is fully mounted before showing the gradient
  nextTick(() => {
    console.log('BuilderGradientText: nextTick after mount, showing gradient background');
    // Show gradient background immediately
    showGradientBackground();
    
    // Show content if initiallyShowContent is true
    if (props.initiallyShowContent) {
      setTimeout(() => {
        console.log('BuilderGradientText: Showing initial content');
        showTextContent();
      }, 500);
    }
  });
  
  // Note: Three.js initialization is now handled in the dynamic import Promise
});

onBeforeUnmount(() => {
  cleanup();
});

// Expose methods to parent component
defineExpose({
  showGradientWithAnimation,
  showGradientBackground,
  showTextContent
});
</script>

<style lang="scss">
.builder-gradient-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 5; /* Lower z-index to be behind the explosion content */
  pointer-events: none; /* Allow clicks to pass through to elements below */
  
  .gradient-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1; // Lower z-index so it's behind the explosion
    opacity: 1; // Make visible from the start
    background: linear-gradient(to right, $red, $purple); // Fallback gradient using SCSS variables
  }
  
  .gradient-canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
  
  .gradient-content {
    position: relative;
    text-align: center;
    color: white;
    padding: 2rem;
    max-width: 800px;
    z-index: 20; /* Increased z-index to ensure it's above everything else when visible */
    pointer-events: auto; /* Enable interaction with content */
    
    .gradient-title {
      // font-size: 3rem;
      margin-bottom: 1rem;
      // font-family: $poppins-extra-bold;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .gradient-description {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      font-family: $poppins;
      line-height: 1.5;
    }
    
    // .gradient-link {
    //   display: inline-block;
    //   padding: 0.75rem 1.5rem;
    //   background-color: white;
    //   color: black;
    //   text-decoration: none;
    //   border-radius: 4px;
    //   font-family: $poppins-semi-bold;
    //   font-size: 1rem;
    //   transition: all 0.3s ease;
    //   pointer-events: auto; /* Enable clicks on the link */
      
    //   &:hover {
    //     transform: translateY(-2px);
    //     box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    //   }
    // }

    .gradient-link {
        display: block;
        font-family: $poppins-semi-bold;
        font-size: 16px;
        padding: $space-xs 0;
        max-width: 200px;
        margin: 0 auto;
        border-bottom: 1px solid $white;
        position: relative;
        text-align: left;
        
        &:after {
          content: "→";
          position: absolute;
          right: 0;
        }
      }
  }
  
  .gui-container {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
    pointer-events: auto !important;
    
    // Style dat.GUI
    .dg.ac {
      z-index: 100 !important;
    }
  }
  
  // Responsive styles
  @include respond-to($tablet) {
    .gradient-content {
      .gradient-title {
        // font-size: 4rem;
      }
      
      .gradient-description {
        font-size: 1.75rem;
      }
    }
  }
  
  @include respond-to($desktop) {
    .gradient-content {
      .gradient-title {
        // font-size: 5rem;
      }
    }
  }
}
</style>
