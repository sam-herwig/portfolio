<template>
  <section class="builder-circular-text pad-bl" ref="circularTextContainer">
    <div class="circular-text-wrapper">
      <div class="circular-text" ref="circularText">
        <div class="text-circle" ref="textCircle">
          <span v-for="(char, index) in circularTextArray" :key="index" class="char" :style="getCharStyle(index)">
            {{ char }}
          </span>
        </div>
        <div v-if="centerImage" class="center-image">
          <img :src="centerImage.src" :alt="centerImage.alt || 'Center image'" />
        </div>
        <div v-else-if="centerText" class="center-text">
          <p>{{ centerText }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { gsap } from 'gsap';

// Props
const props = defineProps({
  // The text to display in a circle
  circularText: {
    type: String,
    required: true
  },
  // Optional center image
  centerImage: {
    type: Object,
    default: null
  },
  // Optional center text (used if no image)
  centerText: {
    type: String,
    default: ''
  },
  // Animation speed in seconds for a full rotation
  rotationSpeed: {
    type: Number,
    default: 20
  },
  // Direction: 1 for clockwise, -1 for counter-clockwise
  direction: {
    type: Number,
    default: 1,
    validator: (value) => value === 1 || value === -1
  },
  // Font size as percentage of circle radius
  fontSize: {
    type: Number,
    default: 5 // Increased from 1.5 to 3
  },
  // Color of the text
  textColor: {
    type: String,
    default: '#000000'
  }
});

// Refs
const circularTextContainer = ref(null);
const circularText = ref(null);
const textCircle = ref(null);

// Split text into array of characters
const circularTextArray = computed(() => {
  // Add spaces between characters for better readability
  return props.circularText.split('');
});

// Animation control
let rotationAnimation = null;

// Calculate position for each character
const getCharStyle = (index) => {
  const totalChars = circularTextArray.value.length;
  // Distribute characters evenly around the circle
  const angle = (index * 360) / totalChars;
  
  return {
    transform: `rotate(${angle}deg)`,
    color: props.textColor,
    transformOrigin: 'center center'
  };
};

// Set up the rotation animation
const setupAnimation = () => {
  if (rotationAnimation) {
    rotationAnimation.kill();
  }
  
  // Animate the text circle as a whole, but not the container
  if (textCircle.value) {
    rotationAnimation = gsap.to(textCircle.value, {
      rotation: props.direction * 360,
      duration: props.rotationSpeed,
      ease: "linear",
      repeat: -1,
      transformOrigin: "center center"
    });
  }
};

// Lifecycle hooks
onMounted(() => {
  setupAnimation();
  
  // Make responsive to window resize
  window.addEventListener('resize', onResize);
  onResize();
});

onBeforeUnmount(() => {
  if (rotationAnimation) {
    rotationAnimation.kill();
  }
  window.removeEventListener('resize', onResize);
});

// Watch for prop changes
watch(() => [props.rotationSpeed, props.direction], () => {
  setupAnimation();
});

// Handle resize
const onResize = () => {
  if (!circularText.value) return;
  
  const containerWidth = circularText.value.offsetWidth;
  const radius = containerWidth / 2;
  
  // Set font size based on radius
  if (textCircle.value) {
    // Calculate font size based on circle radius and props.fontSize
    const calculatedFontSize = Math.max(20, radius * props.fontSize / 100);
    textCircle.value.style.fontSize = `${calculatedFontSize}px`;
    
    // Position each character correctly
    const chars = textCircle.value.querySelectorAll('.char');
    chars.forEach((char, index) => {
      const totalChars = circularTextArray.value.length;
      const angle = (index * 360) / totalChars;
      
      // Set initial position for each character
      gsap.set(char, {
        rotation: angle,
        transformOrigin: 'center center'
      });
    });
  }
};
</script>

<style lang="scss">
.builder-circular-text {
  &.pad-bl {
    padding-top: span(2);
    padding-bottom: span(2);
    display: flex;
    justify-content: center;
    align-items: center;
    
  }
  
  .circular-text-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    
    .circular-text {
      margin: 0 auto;
      border-radius: 50%;
      width: 200px;
      height: 200px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      transform-origin: 50% 50%;
      -webkit-transform-origin: 50% 50%;
      
      
      .text-circle {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        transform-origin: center center;
      }
      
      .char {
        position: absolute;
        display: inline-block;
        bottom: 0;
        height: 100%;
        transform-origin: center center;
        font-family: $poppins-extra-bold;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        width: 1em;
        text-align: center;
        transition: all 0.5s cubic-bezier(0, 0, 0, 1);
      }
      
      .center-image {
        position: relative;
        width: 60%;
        height: 60%;
        border-radius: 50%;
        overflow: hidden;
        z-index: 2;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
      }
      
      .center-text {
        position: relative;
        width: 60%;
        height: 60%;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2;
        
        p {
          font-family: $poppins-semi-bold;
          text-align: center;
          font-size: 1.5rem;
          padding: 1rem;
          
          @include respond-to($tablet) {
            font-size: 2rem;
          }
        }
      }
    }
  }
}
</style> 