<template>
  <section class="builder-image-explosion pad-bl">
    <!-- Gradient Text Component (positioned behind explosion) -->
    <BuilderGradientText
      v-if="gradientText"
      ref="gradientTextComponent"
      :title="gradientText.title"
      :description="gradientText.description"
      :linkText="gradientText.linkText"
      :linkUrl="gradientText.linkUrl"
      :gradientStartColor="gradientText.gradientStartColor"
      :gradientEndColor="gradientText.gradientEndColor"
      :animationDuration="gradientText.animationDuration"
      :initiallyShowContent="false"
    />
    
    <div class="gutter">
      <div class="explosion-container" ref="explosionContainer">
        <!-- Center image -->
        <div class="center-image" ref="centerImageEl">
           <img 
            v-if="centerImage && centerImage.src" 
            :src="centerImage.src" 
            :alt="centerImage.alt || 'Center Image'" 
            class="responsive-image" />
        </div>
        <client-only>
          <!-- Explosion media (combined images and videos) -->
          <template v-for="(item, index) in combinedMedia.value">
            <!-- Image item -->
            <div 
              v-if="item.type === 'image'"
              :key="`img-${index}`"
              class="explosion-media explosion-image"
              :ref="el => { if (el) explosionMediaRefs[index] = el }"
            >
              <img 
                v-if="item.src" 
                :src="item.src" 
                :alt="item.alt || `Explosion Image ${index + 1}`" 
                class="responsive-image"
              />
            </div>
            
            <!-- Video item -->
            <div 
              v-if="item.type === 'video'"
              :key="`vid-${index}`"
              class="explosion-media explosion-video"
              :ref="el => { if (el) explosionMediaRefs[index] = el }"
            >
              <video 
                v-if="item.src" 
                :src="item.src" 
                autoplay 
                muted 
                playsinline
                class="responsive-video"
              ></video>
            </div>
          </template>
      </client-only>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  centerImage: {
    type: Object,
    required: true
  },
  explosionImages: {
    type: Array,
    default: () => []
  },
  explosionVideos: {
    type: Array,
    default: () => []
  },
  animationDuration: {
    type: Number,
    default: 1.5
  },
  staggerDelay: {
    type: Number,
    default: 0.05
  },
  gradientText: {
    type: Object,
    default: () => null
  },
  fadeOutDelay: {
    type: Number,
    default: 2 // Delay in seconds before fading out explosion
  }
});

console.log('BuilderImageExplosion props:', props);

const explosionContainer = ref(null);
const centerImageEl = ref(null);
const explosionMediaRefs = ref([]);

const combinedMedia = ref([]);

// Computed property to combine and shuffle images and videos
// const combinedMedia = computed(() => {
//   // Filter valid images and add type
//   const validImages = (props.explosionImages || [])
//     .filter(img => img && img.src)
//     .map(img => ({ ...img, type: 'image' }));
  
//   // Filter valid videos and add type
//   const validVideos = (props.explosionVideos || [])
//     .filter(vid => vid && vid.src)
//     .map(vid => ({ ...vid, type: 'video' }));
  
//   // Combine both arrays
//   const combined = [...validImages, ...validVideos];
  
//   // Shuffle the array to mix images and videos
//   return shuffleArray(combined);
// });

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Animation timeline
let timeline = null;
const gradientTextComponent = ref(null);

// Function to fade out explosion and show gradient text
const fadeOutExplosionAndShowGradient = () => {
  if (!timeline || !explosionContainer.value) {
    console.error('BuilderImageExplosion: Cannot fade out - timeline or explosionContainer not available');
    return;
  }
  
  console.log('BuilderImageExplosion: Fading out explosion and showing gradient text');
  
  // Create a new timeline for the fade out animation
  const fadeOutTimeline = gsap.timeline();
  
  // Fade out center image - keep it visible longer
  if (centerImageEl.value) {
    console.log('BuilderImageExplosion: Fading out center image');
    fadeOutTimeline.to(centerImageEl.value, {
      opacity: 0,
      duration: 2, // Increased from 1 to 2 seconds
      ease: "power2.inOut",
      delay: 3 // Added 3 second delay before starting fade out
    }, 0);
  }
  
  // Fade out all explosion media
  if (explosionMediaRefs.value.length > 0) {
    console.log(`BuilderImageExplosion: Fading out ${explosionMediaRefs.value.length} explosion media elements`);
    explosionMediaRefs.value.forEach((mediaEl) => {
      fadeOutTimeline.to(mediaEl, {
        opacity: 0,
        duration: 2, // Increased from 1 to 2 seconds
        ease: "power2.inOut",
        delay: 3 // Added 3 second delay before starting fade out
      }, 0);
    });
  }
  
  // After fade out is complete, show the gradient text content
  fadeOutTimeline.call(() => {
    console.log('BuilderImageExplosion: Fade out complete, attempting to show gradient text content');
    
    // Only try to show gradient text if it's available and we're on client-side
    if (!process.client) {
      console.log('BuilderImageExplosion: Not on client-side, cannot show gradient text');
      return;
    }
    
    if (!props.gradientText) {
      console.log('BuilderImageExplosion: No gradientText prop provided');
      return;
    }
    
    if (!gradientTextComponent.value) {
      console.log('BuilderImageExplosion: gradientTextComponent ref is null');
      // Try to find it again after a short delay
      setTimeout(() => {
        if (gradientTextComponent.value && typeof gradientTextComponent.value.showTextContent === 'function') {
          console.log('BuilderImageExplosion: Found gradientTextComponent after delay, showing text content');
          gradientTextComponent.value.showTextContent();
        } else {
          console.error('BuilderImageExplosion: gradientTextComponent still not available after retry');
        }
      }, 500);
      return;
    }
    
    if (typeof gradientTextComponent.value.showTextContent !== 'function') {
      console.error('BuilderImageExplosion: gradientTextComponent.showTextContent is not a function');
      return;
    }
    
    console.log('BuilderImageExplosion: Showing gradient text content with animation');
    gradientTextComponent.value.showTextContent();
  }, [], fadeOutTimeline.duration()); // Ensure this happens after the fade out completes
};

onMounted(() => {

  console.log("COMBINED MEDIA",combinedMedia.value, explosionMediaRefs.value)

  console.log('BuilderImageExplosion mounted with props:', JSON.stringify({
    centerImage: props.centerImage ? { src: props.centerImage.src?.substring(0, 30) + '...' } : null,
    explosionImages: props.explosionImages ? `Array(${props.explosionImages.length})` : [],
    explosionVideos: props.explosionVideos ? `Array(${props.explosionVideos.length})` : [],
    animationDuration: props.animationDuration,
    staggerDelay: props.staggerDelay,
    fadeOutDelay: props.fadeOutDelay,
    gradientText: props.gradientText ? {
      title: props.gradientText.title,
      description: props.gradientText.description?.substring(0, 30) + '...',
      gradientStartColor: props.gradientText.gradientStartColor,
      gradientEndColor: props.gradientText.gradientEndColor
    } : null
  }));
  
  // Initialize gradient background with a delay to ensure component is fully mounted
  nextTick(() => {

    const validImages = (props.explosionImages || [])
      .filter(img => img && img.src)
      .map(img => ({ ...img, type: 'image' }));
    const validVideos = (props.explosionVideos || [])
      .filter(vid => vid && vid.src)
      .map(vid => ({ ...vid, type: 'video' }));
    const combined = [...validImages, ...validVideos];
    combinedMedia.value = shuffleArray(combined);
    if (process.client && props.gradientText) {
      console.log('BuilderImageExplosion: Checking for gradientTextComponent');
      
      if (gradientTextComponent.value && typeof gradientTextComponent.value.showGradientBackground === 'function') {
        console.log('BuilderImageExplosion: Initializing gradient background');
        gradientTextComponent.value.showGradientBackground();
      } else {
        console.log('BuilderImageExplosion: gradientTextComponent not ready yet, retrying in 500ms');
        // Try again after a short delay
        setTimeout(() => {
          if (gradientTextComponent.value && typeof gradientTextComponent.value.showGradientBackground === 'function') {
            console.log('BuilderImageExplosion: Initializing gradient background (retry)');
            gradientTextComponent.value.showGradientBackground();
          } else {
            console.error('BuilderImageExplosion: gradientTextComponent still not available after retry');
          }
        }, 500);
      }
    } else {
      console.log('BuilderImageExplosion: No gradientText prop provided or not on client-side');
    }
  });
  
  // Only proceed if we have valid media
  if (combinedMedia.value.length > 0) {
    console.log('Starting explosion animation with', combinedMedia.value.length, 'media items');
    
    // Initialize all explosion media at the center position
    explosionMediaRefs.value.forEach(mediaEl => {
      gsap.set(mediaEl, {
        x: 0,
        y: 0,
        scale: 0.5,
        opacity: 0
      });
    });
    
    // Create animation timeline
    timeline = gsap.timeline({ 
      paused: true,
      onComplete: () => {
        console.log('Explosion animation complete, waiting', props.fadeOutDelay, 'seconds before fade out');
        // After the explosion animation completes, wait for fadeOutDelay seconds then fade out
        // Use a longer delay to ensure the image stays visible for a CMS-able amount of time
        const effectiveFadeOutDelay = Math.max(props.fadeOutDelay, 5); // Ensure at least 5 seconds
        console.log('Using effective fade out delay of', effectiveFadeOutDelay, 'seconds');
        gsap.delayedCall(effectiveFadeOutDelay, fadeOutExplosionAndShowGradient);
      }
    });
    
    // Get container dimensions for boundary calculations
    const containerWidth = explosionContainer.value.offsetWidth;
    const containerHeight = explosionContainer.value.offsetHeight;
    
    // Calculate safe boundaries (90% of container to ensure images stay within view)
    // Using a larger percentage to spread images more
    const maxX = containerWidth * 0.45;  // 45% from center in each direction
    const maxY = containerHeight * 0.45; // 45% from center in each direction
    
    // Store positions of already placed items for collision detection
    const placedItems = [];
    
    // Function to check if a new position would cause too much overlap with existing items
    const checkOverlap = (newX, newY, newScale, mediaEl) => {
      // Get the approximate dimensions of the current element
      const elWidth = mediaEl.offsetWidth * newScale;
      const elHeight = mediaEl.offsetHeight * newScale;
      
      // If we don't have dimensions yet, allow placement
      if (!elWidth || !elHeight) return true;
      
      // Maximum allowed overlap (15% of the item's area)
      const maxOverlapPercent = 0.15;
      const itemArea = elWidth * elHeight;
      const maxOverlapArea = itemArea * maxOverlapPercent;
      
      // Check against all previously placed items
      for (const item of placedItems) {
        // Calculate overlap area
        const overlapWidth = Math.max(0, 
          Math.min(newX + elWidth/2, item.x + item.width/2) - 
          Math.max(newX - elWidth/2, item.x - item.width/2)
        );
        
        const overlapHeight = Math.max(0, 
          Math.min(newY + elHeight/2, item.y + item.height/2) - 
          Math.max(newY - elHeight/2, item.y - item.height/2)
        );
        
        const overlapArea = overlapWidth * overlapHeight;
        
        // If overlap exceeds our threshold, reject this position
        if (overlapArea > maxOverlapArea) {
          return false;
        }
      }
      
      // Position is acceptable
      return true;
    };
    
    // Function to get a position in a specific quadrant
    const getQuadrantPosition = (quadrant, mediaEl) => {
      // Define angle ranges for each quadrant (in radians)
      const quadrantAngles = {
        topLeft: { min: Math.PI * 0.75, max: Math.PI * 1.25 },     // 135° to 225°
        topRight: { min: Math.PI * 0.25, max: Math.PI * 0.75 },    // 45° to 135°
        bottomRight: { min: -Math.PI * 0.25, max: Math.PI * 0.25 }, // -45° to 45°
        bottomLeft: { min: Math.PI * 1.25, max: Math.PI * 1.75 }    // 225° to 315°
      };
      
      const angles = quadrantAngles[quadrant];
      
      // Try up to 10 times to find a valid position
      for (let attempt = 0; attempt < 10; attempt++) {
        // Random angle within the quadrant's range
        const angle = angles.min + Math.random() * (angles.max - angles.min);
        
        // Distance from center (40% to 100% of max)
        const distanceFactor = 0.4 + Math.random() * 0.6;
        
        // Calculate position
        const x = Math.cos(angle) * maxX * distanceFactor;
        const y = Math.sin(angle) * maxY * distanceFactor;
        
        // Scale without rotation (30% to 100%)
        const scale = 0.3 + Math.random() * 0.7;
        
        // Check if this position would cause too much overlap
        if (checkOverlap(x, y, scale, mediaEl)) {
          // Add this position to our placed items
          placedItems.push({
            x,
            y,
            width: mediaEl.offsetWidth * scale,
            height: mediaEl.offsetHeight * scale
          });
          
          return { x, y, scale };
        }
      }
      
      // If we couldn't find a non-overlapping position after 10 attempts,
      // just return a position without checking for overlap
      const angle = angles.min + Math.random() * (angles.max - angles.min);
      const distanceFactor = 0.4 + Math.random() * 0.6;
      const x = Math.cos(angle) * maxX * distanceFactor;
      const y = Math.sin(angle) * maxY * distanceFactor;
      const scale = 0.3 + Math.random() * 0.7;
      
      placedItems.push({
        x,
        y,
        width: mediaEl.offsetWidth * scale,
        height: mediaEl.offsetHeight * scale
      });
      
      return { x, y, scale };
    };
    
    // Assign each item to a quadrant, distributing them evenly
    const quadrants = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
    
    // Animate each explosion media item to a position in its assigned quadrant
    explosionMediaRefs.value.forEach((mediaEl, index) => {
      // Determine which quadrant this item belongs to
      const quadrant = quadrants[index % quadrants.length];
      
      // Get position and scale for this item
      const { x, y, scale } = getQuadrantPosition(quadrant, mediaEl);
      
      timeline.to(mediaEl, {
        x,
        y,
        scale,
        opacity: 1,
        duration: props.animationDuration,
        ease: "power2.out"
      }, index * props.staggerDelay);
    });
    
    // Play the animation
    timeline.play();
  } else {
    console.log('BuilderImageExplosion: No valid media to animate');
    
    // If there's no media to animate but we have gradient text, show it after a delay
    if (props.gradientText) {
      console.log('BuilderImageExplosion: No media but gradientText exists, showing text after delay');
      setTimeout(() => {
        if (gradientTextComponent.value && typeof gradientTextComponent.value.showTextContent === 'function') {
          console.log('BuilderImageExplosion: Showing gradient text content directly');
          gradientTextComponent.value.showTextContent();
        }
      }, 2000); // Show after 2 seconds
    }
  }
});

onBeforeUnmount(() => {
  // Clean up GSAP animations
  if (timeline) {
    timeline.kill();
  }
});
</script>

<style lang="scss">
.builder-image-explosion {
  position: relative;
  width: 100%;
  height: 100vh; /* Using vh instead of svh for better compatibility */
  min-height: 100vh; /* Ensure minimum height is full viewport */
  
  .explosion-container {
    position: absolute; /* Changed from relative to absolute */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    z-index: 10; /* Ensure explosion is above the gradient background */
  }
  
  .center-image {
    position: relative;
    width: 50%;
    max-width: 350px;
    z-index: 12; /* Increased z-index to be above explosion media */
    // height: 200px;
  }
  
  .explosion-media {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50%;
    max-width: 450px;
    z-index: 11; /* Increased z-index to be above gradient but below center image */
    will-change: transform, opacity;
  }

  .explosion-video {
    overflow: hidden;
  }

  img, video {
    width: 100%;
    height: auto;
    object-fit: cover;
  }
  
  @include respond-to($large-tablet) {
    .gutter {
      margin: 0 span(1);
    }
  }

  @include respond-to($desktop) {
    .gutter {
      margin: 0 span(2);
    }
  }

  @include respond-to($retina-macbook) {
    .gutter {
      margin: 0 span(2.5);
    }
  }
}
</style>
