<template>
  <section class="builder-masonry-wall pad-bl" ref="masonryContainer">
    <div class="gutter-lg">
      <h2 v-if="title" class="masonry-title" ref="masonryTitle">{{ title }}</h2>
      <div class="masonry-grid" ref="masonryGrid">
        <div 
          v-for="(item, index) in items" 
          :key="item.src || index" 
          class="masonry-item"
          :class="{ 'is-video': item.type === 'video' }"
          ref="masonryItems"
          @click="openModal(item)"
        >
          <!-- Image Item -->
          <img 
            v-if="item.type === 'image'" 
            :src="item.src" 
            :alt="item.alt || `Masonry image ${index + 1}`"
            loading="lazy"
            @load="onMediaLoaded(index)"
            @error="onMediaLoaded(index)"
          />
          
          <!-- Video Item -->
          <video 
            v-if="item.type === 'video'"
            :src="item.src"
            :poster="item.poster"
            :muted="item.muted !== false"
            :loop="item.loop !== false"
            :autoplay="item.autoplay !== false"
            playsinline
            loading="lazy"
            @loadeddata="onMediaLoaded(index)"
            @error="onMediaLoaded(index)"
          ></video>
        </div>
      </div>
    </div>
    
    <!-- Media Modal -->
    <MediaModal 
      :is-open="modalOpen" 
      :media="selectedMedia" 
      @close="closeModal" 
    />
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MediaModal from './MediaModal.vue';

// Register GSAP plugins
if (process.client) {
  gsap.registerPlugin(ScrollTrigger);
}

// Props
const props = defineProps({
  items: {
    type: Array,
    required: true,
    // Each item should have: 
    // - type: 'image' or 'video'
    // - src: URL to the image or video
    // - alt: (for images) alt text
    // - poster: (for videos) poster image
    // - muted: (for videos) boolean, default true
    // - loop: (for videos) boolean, default true
    // - autoplay: (for videos) boolean, default true
    // - aspectRatio: (optional) custom aspect ratio as a number (width/height)
  },
  title: {
    type: String,
    default: ''
  },
  columnWidth: {
    type: Number,
    default: 300
  },
  gapSize: {
    type: Number,
    default: 20
  }
});

// Refs
const masonryContainer = ref(null);
const masonryGrid = ref(null);
const masonryItems = ref([]);
const masonryTitle = ref(null);
let resizeObserver = null;
let scrollTrigger = null;
let mutationObserver = null;

// Modal state
const modalOpen = ref(false);
const selectedMedia = ref({});

// Track loaded media
const loadedItems = ref(0);
const totalItems = ref(0);
const loadedItemsMap = ref({});
const layoutApplied = ref(false);

// Modal handlers
const openModal = (item) => {
  selectedMedia.value = item;
  modalOpen.value = true;
  
  // Pause all background videos when modal opens
  const videos = masonryGrid.value?.querySelectorAll('video');
  videos?.forEach(video => {
    video.pause();
  });
};

const closeModal = () => {
  modalOpen.value = false;
  
  // Resume video playback for visible videos
  if (masonryItems.value) {
    masonryItems.value.forEach((item, index) => {
      if (props.items[index].type === 'video') {
        const video = item.querySelector('video');
        if (video) {
          const rect = item.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          if (isVisible) {
            video.play().catch(() => {});
          }
        }
      }
    });
  }
};

// Media loaded handler
const onMediaLoaded = (index) => {
  if (!loadedItemsMap.value[index]) {
    loadedItemsMap.value[index] = true;
    loadedItems.value++;
    
    if (loadedItems.value >= totalItems.value) {
      applyMasonryLayout();
      layoutApplied.value = true;
    }
  }
};

// Masonry layout function
const applyMasonryLayout = () => {
  if (!masonryGrid.value || !masonryItems.value.length) return;
  
  // Apply masonry layout
  
  const containerWidth = masonryGrid.value.offsetWidth;
  
  // Adjust column width for mobile
  let columnWidth = props.columnWidth;
  let numColumns;
  
  // For mobile (under 768px), force 2 columns with adjusted width
  if (window.innerWidth < 768) {
    numColumns = 2;
    // Calculate column width based on container width, accounting for gap
    columnWidth = (containerWidth - props.gapSize) / 2;
  } else {
    // Calculate number of columns for larger screens
    numColumns = Math.max(1, Math.floor(containerWidth / (props.columnWidth + props.gapSize)));
    // Adjust column width to fit container evenly if needed
    if (numColumns > 1) {
      const availableWidth = containerWidth - ((numColumns - 1) * props.gapSize);
      columnWidth = availableWidth / numColumns;
    }
  }
  
  const gap = props.gapSize;
  
  // Calculated columns and width
  
  // Initialize column heights
  const columnHeights = Array(numColumns).fill(0);
  
  // Calculate total width needed for the grid
  const totalGridWidth = (numColumns * columnWidth) + ((numColumns - 1) * gap);
  
  // Center the grid by calculating left offset
  const leftOffset = Math.max(0, (containerWidth - totalGridWidth) / 2);
  
  // Position each item
  masonryItems.value.forEach((item, index) => {
    // Find the shortest column
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    
    // Calculate position with centering offset
    const x = leftOffset + (shortestColumnIndex * (columnWidth + gap));
    const y = columnHeights[shortestColumnIndex];
    
    // Get custom aspect ratio if specified
    const customAspectRatio = props.items[index].aspectRatio;
    
    // Item positioning
    
    // Apply custom aspect ratio if provided
    if (customAspectRatio) {
      const [width, height] = customAspectRatio.split('/').map(Number);
      if (width && height) {
        item.style.aspectRatio = `${width}/${height}`;
      }
    }
    
    // Set position
    gsap.set(item, {
      x,
      y,
      width: columnWidth
    });
    
    // Update column height - make sure we have a valid height
    const itemHeight = item.offsetHeight || 0;
    columnHeights[shortestColumnIndex] += itemHeight + gap;
  });
  
  // Set container height to the height of the tallest column
  const maxHeight = Math.max(...columnHeights);
  
  // Set explicit height with a small buffer to prevent overflow
  if (maxHeight > 0) {
    masonryGrid.value.style.height = `${maxHeight}px`;
  } else {
    masonryGrid.value.style.height = '500px'; // Fallback height
  }
};

// Check if all items are loaded and apply layout
const checkAllItemsLoaded = () => {
  if (loadedItems.value >= totalItems.value && !layoutApplied.value) {
    applyMasonryLayout();
    layoutApplied.value = true;
  }
};

// Setup media loading handlers
const setupMediaLoadHandlers = () => {
  if (!process.client || !masonryItems.value.length) return;
  
  // Reset counters
  loadedItems.value = 0;
  totalItems.value = masonryItems.value.length;
  loadedItemsMap.value = {};
  layoutApplied.value = false;
  
  // Check for already loaded images
  masonryItems.value.forEach((item, index) => {
    // Handle images
    const img = item.querySelector('img');
    if (img && img.complete) {
      onMediaLoaded(index);
    }
    
    // Handle videos
    const video = item.querySelector('video');
    if (video && video.readyState >= 2) {
      onMediaLoaded(index);
    }
  });
  
  // Set up a fallback timer to ensure layout is applied even if some images fail to load
  setTimeout(() => {
    if (!layoutApplied.value) {
      applyMasonryLayout();
      layoutApplied.value = true;
    }
  }, 3000);
};

// Animation for items when they come into view
const animateItems = () => {
  if (!masonryItems.value.length || !process.client) return;
  
  // Reset any existing animations
  if (scrollTrigger) {
    scrollTrigger.kill();
  }
  
  // Create a GSAP timeline for the staggered animation
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: masonryContainer.value,
      start: "top bottom-=100",
      end: "bottom top",
      toggleActions: "play none none none"
    }
  });
  
  // Animate title if it exists
  if (props.title && masonryTitle.value) {
    gsap.set(masonryTitle.value, { 
      opacity: 0,
      y: 30
    });
    
    tl.to(masonryTitle.value, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    });
  }
  
  // Initial state - all items hidden
  gsap.set(masonryItems.value, { 
    opacity: 0,
    y: 50
  });
  
  // Animate items with stagger
  tl.to(masonryItems.value, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    stagger: {
      amount: 0.8,
      grid: "auto",
      from: "start"
    }
  }, "-=0.4"); // Slightly overlap with title animation if there is one
  
  scrollTrigger = tl.scrollTrigger;
};

// Initialize videos
const setupVideos = () => {
  if (!process.client) return;
  
  masonryItems.value.forEach((item, index) => {
    if (props.items[index].type === 'video') {
      const video = item.querySelector('video');
      if (video) {
        // Create intersection observer for each video
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        }, { threshold: 0.3 });
        
        observer.observe(item);
      }
    }
  });
};

// Handle window resize
const handleResize = () => {
  // Use a debounced version to avoid too many recalculations
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    
    // Force recalculation of container dimensions
    if (masonryGrid.value) {
      // Reset any inline width that might have been set
      masonryGrid.value.style.width = '100%';
    }
    
    // Apply layout after a brief delay to ensure DOM updates
    setTimeout(() => {
      applyMasonryLayout();
    }, 50);
    
    // Re-check all media is loaded
    setupMediaLoadHandlers();
  }, 250); // 250ms debounce
};

let resizeTimeout;

// Lifecycle hooks
onMounted(async () => {
  if (process.client) {
    // Wait for DOM update
    await nextTick();
    
    // Apply initial layout with a slight delay to ensure DOM is ready
    setTimeout(() => {
      // Initialize layout
      applyMasonryLayout();
      
      // Set up resize observer
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      
      if (masonryGrid.value) {
        resizeObserver.observe(masonryGrid.value);
      }
      
      // Set up animations
      animateItems();
      
      // Set up videos
      setupVideos();
      
      // Set up media load handlers
      setupMediaLoadHandlers();
      
      // Set up mutation observer to watch for changes in the masonry grid
      mutationObserver = new MutationObserver((mutations) => {
        // Check if we need to reapply layout
        if (masonryGrid.value && mutations.some(m => m.type === 'childList' || m.type === 'attributes')) {
          applyMasonryLayout();
        }
      });
      
      if (masonryGrid.value) {
        mutationObserver.observe(masonryGrid.value, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'src']
        });
      }
      
      // Add window resize listener
      window.addEventListener('resize', handleResize);
      
      // Also listen for orientation changes specifically for mobile
      window.addEventListener('orientationchange', () => {
        // Wait a bit for the browser to settle after orientation change
        setTimeout(() => {
          // Reset any inline width that might have been set
          if (masonryGrid.value) {
            masonryGrid.value.style.width = '100%';
          }
          // Apply layout
          applyMasonryLayout();
        }, 300);
      });
    }, 100);
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    // Clean up
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    
    if (scrollTrigger) {
      scrollTrigger.kill();
    }
    
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
    
    // Clear any pending timeouts
    clearTimeout(resizeTimeout);
    
    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', applyMasonryLayout);
  }
});
</script>

<style lang="scss">
.builder-masonry-wall {
  &.pad-bl {
    @include block-outer;
  }
  
  .gutter-lg {
    max-width: 1200px;
    margin: 0 auto;
    padding-left: span(1);
    padding-right: span(1);
    box-sizing: border-box; // Add box-sizing to include padding in width calculation
    
  }
  
  .masonry-grid {
    position: relative;
    width: 100%;
    margin: 0 auto;
    min-height: 200px; // Minimum height to prevent layout shifts
    overflow: hidden; // Change from visible to hidden to prevent horizontal overflow
    box-sizing: border-box; // Add box-sizing to include padding in width calculation
    
    // Ensure the container has enough padding at the bottom to prevent overflow
    padding-bottom: 20px;
    
    // Clear floats to contain all items
    &::after {
      content: '';
      display: table;
      clear: both;
    }
  }
  
  .masonry-item {
    position: absolute;
    overflow: hidden;
    border-radius: $radius-xs;
    transform-origin: center;
    will-change: transform, opacity;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;
    display: block; // Ensure block display
    cursor: pointer;
    
    img, video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }
    
    &:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      
      img, video {
        transform: scale(1.05);
      }
    }
    
    // Default aspect ratios for different items if not specified
    &:nth-child(3n+1):not([style*="aspect-ratio"]) {
      aspect-ratio: 16/9;
    }
    
    &:nth-child(3n+2):not([style*="aspect-ratio"]) {
      aspect-ratio: 4/3;
    }
    
    &:nth-child(3n+3):not([style*="aspect-ratio"]) {
      aspect-ratio: 1/1;
    }
    
    // Video specific styles
    &.is-video {
      &::after {
        content: '';
        position: absolute;
        top: 10px;
        right: 10px;
        width: 12px;
        height: 12px;
        background-color: $red;
        border-radius: 50%;
        opacity: 0.8;
      }
    }
  }
  
  // Mobile styles
  @media (max-width: 767px) {
    .masonry-grid {
      padding: 0 10px 30px; // Add more bottom padding on mobile
      width: 100%; // Change from calc(100% - 20px) to 100% to prevent overflow
      box-sizing: border-box;
    }
    
    .masonry-item {
      // Adjust aspect ratios for mobile 2-column layout
      &:nth-child(odd):not([style*="aspect-ratio"]) {
        aspect-ratio: 1/1; // Square for odd items
      }
      
      &:nth-child(even):not([style*="aspect-ratio"]) {
        aspect-ratio: 3/4; // Portrait for even items
      }
      
      // Add cursor pointer for mobile
      cursor: pointer;
    }
  }
  
  .masonry-title {
    font-family: $poppins-extra-bold;
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
    
    @include respond-to($tablet) {
      font-size: 3rem;
      margin-bottom: 3rem;
    }
    
    @include respond-to($desktop) {
      font-size: 3.5rem;
    }
  }
}
</style> 
