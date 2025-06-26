<template>
  <section class="builder-hero-text pad-bl" ref="heroContainer">
    <div class="hero-content">
      <!-- Title with TextPressure -->
      <div class="hero-title-container">
        <TextPressure 
          :text="title"
          :width="true"
          :weight="true"
          :italic="false"
          :stroke="false"
          :textColor="textColor"
          :minFontSize="80"
          className="hero-title"
          parentClassName="hero-title-wrapper"
          encryptedClassName="encrypted"
          animateOn="hover"
          :sequential="true"
          revealDirection="start"
          :speed="30"
          :autoAnimate="true"
          :autoAnimateInterval="5000"
        />
      </div>
      
      <!-- Optional Subtitle with TextPressure -->
      <div v-if="subtitle" class="hero-subtitle-container">
        <TextPressure 
          :text="subtitle"
          :width="true"
          :weight="true"
          :italic="false"
          :stroke="false"
          :textColor="textColor"
          :minFontSize="80"
          className="hero-subtitle"
          parentClassName="hero-subtitle-wrapper"
          encryptedClassName="encrypted"
          animateOn="hover"
          :sequential="true"
          revealDirection="start"
          :speed="20"
          :autoAnimate="true"
          :autoAnimateInterval="6000"
        />
      </div>
      
      <!-- Circular Text -->
      <div class="circular-text-container">
        <BuilderCircularText
          :circularText="circularText"
          :rotationSpeed="rotationSpeed"
          :direction="direction"
          :fontSize="fontSize"
          :textColor="textColor"
          :centerText="centerText"
          :centerImage="centerImage"
        />
      </div>
      
      <!-- Link -->
      <div class="hero-link-container" v-if="linkUrl">
        <a :href="linkUrl" class="hero-link" target="_blank" rel="noopener noreferrer">
          {{ linkText || 'Learn More' }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TextPressure from './TextPressure.vue';
import BuilderCircularText from './BuilderCircularText.vue';

// Props
const props = defineProps({
  // Text content
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  circularText: {
    type: String,
    default: ''
  },
  centerText: {
    type: String,
    default: ''
  },
  centerImage: {
    type: Object,
    default: null
  },
  linkUrl: {
    type: String,
    default: ''
  },
  linkText: {
    type: String,
    default: 'Learn More'
  },
  
  // Styling
  backgroundColor: {
    type: String,
    default: '#e94234' // Default to red
  },
  textColor: {
    type: String,
    default: '#000000' // Default to black
  },
  
  // Circular text options
  rotationSpeed: {
    type: Number,
    default: 20
  },
  direction: {
    type: Number,
    default: 1,
    validator: (value) => value === 1 || value === -1
  },
  fontSize: {
    type: Number,
    default: 5
  }
});

// Refs
const heroContainer = ref(null);

// Set background color on mount
onMounted(() => {
  if (heroContainer.value) {
    heroContainer.value.style.backgroundColor = props.backgroundColor;
  }
});
</script>

<style lang="scss">
.builder-hero-text {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  .hero-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: $space-l;
    padding-top: 80px;
    gap: 2rem;
  }
  
  .hero-title-container {
    position: relative;
    text-align: center;
    z-index: 2;
    width: 80%;
    max-width: 1200px;
    
    .hero-title-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
    }
  }
  
  .hero-subtitle-container {
    position: relative;
    text-align: center;
    z-index: 2;
    width: 80%;
    max-width: 1000px;
    margin-top: -1rem;
    
    .hero-subtitle-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    
    .hero-subtitle {
      // font-family: $poppins;
      opacity: 0.85;
    }
  }
  
  .circular-text-container {
    position: relative;
    width: 300px;
    height: 300px;
    z-index: 1;
    margin: 2rem 0;
    display: flex; 
    justify-content: center;
    align-items: center;
    
    @media (min-width: 768px) {
      width: 400px;
      height: 400px;
    }
    
    .builder-circular-text.pad-bl {
      padding: 0;
    }
  }
  
  .hero-link-container {
    position: relative;
    z-index: 2;
    margin-top: 2rem;
    
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
    }
  }
  
  /* Mobile styles */
  @media (max-width: 767px) {
    .hero-content {
      padding: $space-m;
    }
    
    .hero-title-container,
    .hero-subtitle-container {
      width: 90%;
    }
    
    .hero-link-container {
      .hero-link {
        font-size: 1rem;
        padding: 0.6rem 1.5rem;
      }
    }
  }
}
</style> 