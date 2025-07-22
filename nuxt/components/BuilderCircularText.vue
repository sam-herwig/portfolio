<template>
  <section class="builder-circular-text pad-bl" ref="circularTextContainer">
    <div class="circular-text-wrapper">
      <div class="circular-text" :style="circularTextStyle">
        <!-- SVG implementation for best performance -->
        <svg class="text-svg" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="circlePath" d="M 250, 250 m -200, 0 a 200,200 0 1,1 400,0 a 200,200 0 1,1 -400,0" />
          </defs>
          <text :fill="textColor" :font-size="svgFontSize" text-anchor="middle" :letter-spacing="letterSpacing" dominant-baseline="middle">
            <textPath href="#circlePath" startOffset="50%">
              {{ repeatedText }}
            </textPath>
          </text>
        </svg>
        
        <!-- Center content -->
        <div class="center-content">
          <img v-if="centerImage" 
               :src="centerImage.src" 
               :alt="centerImage.alt || 'Center image'" 
               class="center-image" />
          <p v-else-if="centerText" class="center-text">{{ centerText }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

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
    default: 4 // 5% of radius
  },
  // Color of the text
  textColor: {
    type: String,
    default: '#000000'
  }
});

// Refs
const circularTextContainer = ref(null);
const containerSize = ref(500);

// Repeat text to fill the circle
const repeatedText = computed(() => {
  const text = props.circularText;
  // With larger font, we need fewer repetitions
  const repeatCount = Math.max(1, Math.ceil(200 / text.length));
  return (text + ' • ').repeat(repeatCount);
});

// Dynamic styles
const circularTextStyle = computed(() => ({
  '--rotation-duration': `${props.rotationSpeed}s`,
  '--rotation-direction': props.direction === 1 ? 'normal' : 'reverse',
  width: `${containerSize.value}px`,
  height: `${containerSize.value}px`
}));

// Calculate font size as percentage of radius
const svgFontSize = computed(() => {
  // SVG circle radius is 200, so calculate fontSize as percentage
  const radius = 200;
  return (radius * props.fontSize / 100) * 3; // Multiply by 3 for 3x larger
});

// Dynamic letter spacing based on text length
const letterSpacing = computed(() => {
  const textLength = props.circularText.length;
  // Adjust letter spacing inversely to text length
  if (textLength < 20) return '0.5em';
  if (textLength < 30) return '0.3em';
  if (textLength < 40) return '0.2em';
  return '0.1em';
});

// Debounced resize handler
let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (!circularTextContainer.value) return;
    
    const wrapper = circularTextContainer.value.querySelector('.circular-text-wrapper');
    if (wrapper) {
      const maxSize = Math.min(wrapper.offsetWidth * 0.9, wrapper.offsetHeight * 0.9, 800);
      containerSize.value = maxSize;
    }
  }, 150);
};

// Lifecycle
onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  clearTimeout(resizeTimeout);
  window.removeEventListener('resize', handleResize);
});
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
    max-width: 800px;
    margin: 0 auto;
  }
  
  .circular-text {
    position: relative;
    animation: rotate var(--rotation-duration) linear infinite;
    animation-direction: var(--rotation-direction);
    will-change: transform;
    transform: translateZ(0); // GPU acceleration
    
    @keyframes rotate {
      from {
        transform: rotate(0deg) translateZ(0);
      }
      to {
        transform: rotate(360deg) translateZ(0);
      }
    }
    
    .text-svg {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      
      text {
        font-family: $poppins-extra-bold;
        text-transform: uppercase;
      }
    }
    
    .center-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60%;
      height: 60%;
      display: flex;
      justify-content: center;
      align-items: center;
      
      .center-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      
      .center-text {
        font-family: $poppins-semi-bold;
        text-align: center;
        font-size: 1.5rem;
        
        @media #{$tablet} {
          font-size: 2rem;
        }
      }
    }
  }
  
  // Pause animation on hover for better UX
  .circular-text-wrapper:hover .circular-text {
    animation-play-state: paused;
  }
  
  // Responsive adjustments
  @media #{$mobile} {
    .circular-text {
      width: 300px !important;
      height: 300px !important;
    }
  }
  
  @media #{$tablet} {
    .circular-text {
      width: 450px !important;
      height: 450px !important;
    }
  }
}
</style>