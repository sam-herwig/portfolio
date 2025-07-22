<template>
  <span 
    ref="containerRef"
    class="decrypted-text-wrapper"
    :class="parentClassName"
    @mouseenter="animateOn === 'hover' ? setIsHovering(true) : null"
    @mouseleave="animateOn === 'hover' ? setIsHovering(false) : null"
    :style="{
      fontSize: `${fontSize}px`
    }"
    >
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">
      <span
        v-for="(char, index) in displayText.split('')"
        :key="index"
        :class="revealedIndices.has(index) || !isScrambling || !isHovering ? className : encryptedClassName"
      >
        {{ char }}
      </span>
    </span>
  </span>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 20
  },
  maxIterations: {
    type: Number,
    default: 1000
  },
  sequential: {
    type: Boolean,
    default: false
  },
  revealDirection: {
    type: String,
    default: 'start',
    validator: (value) => ['start', 'end', 'center'].includes(value)
  },
  useOriginalCharsOnly: {
    type: Boolean,
    default: false
  },
  characters: {
    type: String,
    default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+'
  },
  className: {
    type: String,
    default: ''
  },
  parentClassName: {
    type: String,
    default: ''
  },
  encryptedClassName: {
    type: String,
    default: ''
  },
  animateOn: {
    type: String,
    default: 'hover',
    validator: (value) => ['hover', 'view'].includes(value)
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  minFontSize: {
    type: Number,
    default: 48
  },
  width: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Boolean,
    default: false
  },
  autoAnimate: {
    type: Boolean,
    default: true
  },
  autoAnimateInterval: {
    type: Number,
    default: 2000 // 2 seconds in milliseconds
  }
});

const displayText = ref(props.text);
const isHovering = ref(false);
const isScrambling = ref(false);
const revealedIndices = ref(new Set());
const hasAnimated = ref(false);
const containerRef = ref(null);
const fontSize = ref(props.minFontSize);

let animationId = null;
let currentIteration = 0;
let autoAnimateInterval = null; // For periodic animation
let lastFrameTime = 0;

// Calculate appropriate font size based on container width
const calculateFontSize = () => {
  if (!containerRef.value) return;
  
  const containerWidth = containerRef.value.offsetWidth;
  const textLength = props.text.length;
  const windowWidth = window.innerWidth;
  
  // Calculate font size based on container width and text length
  let calculatedSize;
  
  // Different scaling factors based on screen size
  if (windowWidth < 768) { // Mobile
    // For short text, use higher divisor to prevent excessive size
    const divisor = textLength <= 2 ? 1.5 : 0.8;
    calculatedSize = containerWidth / (textLength * divisor);
  } 
  else if (windowWidth < 1024) { // Tablet
    const divisor = textLength <= 2 ? 1.2 : 0.7;
    calculatedSize = containerWidth / (textLength * divisor);
  }
  else if (windowWidth < 1440) { // Desktop
    const divisor = textLength <= 2 ? 1.0 : 0.6;
    calculatedSize = containerWidth / (textLength * divisor);
  }
  else { // Large Desktop
    const divisor = textLength <= 2 ? 0.9 : 0.5;
    calculatedSize = containerWidth / (textLength * divisor);
  }
  
  // Apply min constraints
  const minSize = props.minFontSize;
  if (calculatedSize < minSize) {
    calculatedSize = minSize;
  }
  
  // Cap font sizes based on screen size
  let maxSize;
  if (windowWidth < 768) {
    maxSize = 80;
  } else if (windowWidth < 1024) {
    maxSize = 120;
  } else if (windowWidth < 1440) {
    maxSize = 130;
  } else {
    maxSize = 140;
  }
  
  if (calculatedSize > maxSize) {
    calculatedSize = maxSize;
  }
  
  // Set the font size
  fontSize.value = calculatedSize;
};

const getNextIndex = (revealedSet) => {
  const textLength = props.text.length;
  switch (props.revealDirection) {
    case 'start':
      return revealedSet.size;
    case 'end':
      return textLength - 1 - revealedSet.size;
    case 'center': {
      const middle = Math.floor(textLength / 2);
      const offset = Math.floor(revealedSet.size / 2);
      const nextIndex =
        revealedSet.size % 2 === 0
          ? middle + offset
          : middle - offset - 1;

      if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
        return nextIndex;
      }

      for (let i = 0; i < textLength; i++) {
        if (!revealedSet.has(i)) return i;
      }
      return 0;
    }
    default:
      return revealedSet.size;
  }
};

const shuffleText = (originalText, currentRevealed) => {
  const availableChars = props.useOriginalCharsOnly
    ? Array.from(new Set(originalText.split(''))).filter((char) => char !== ' ')
    : props.characters.split('');

  if (props.useOriginalCharsOnly) {
    const positions = originalText.split('').map((char, i) => ({
      char,
      isSpace: char === ' ',
      index: i,
      isRevealed: currentRevealed.has(i),
    }));

    const nonSpaceChars = positions
      .filter((p) => !p.isSpace && !p.isRevealed)
      .map((p) => p.char);

    for (let i = nonSpaceChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonSpaceChars[i], nonSpaceChars[j]] = [nonSpaceChars[j], nonSpaceChars[i]];
    }

    let charIndex = 0;
    return positions
      .map((p) => {
        if (p.isSpace) return ' ';
        if (p.isRevealed) return originalText[p.index];
        return nonSpaceChars[charIndex++];
      })
      .join('');
  } else {
    return originalText
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' ';
        if (currentRevealed.has(i)) return originalText[i];
        return availableChars[Math.floor(Math.random() * availableChars.length)];
      })
      .join('');
  }
};

const setIsHovering = (value) => {
  isHovering.value = value;
  
  // Immediately trigger animation when hovering starts
  if (value) {
    startAnimation();
  } else {
    stopAnimation();
  }
};

const startAnimation = () => {
  isScrambling.value = true;
  currentIteration = 0;
  lastFrameTime = 0;
  
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  // Make animation last 3x longer by slowing down the interval
  // Original speed is multiplied by 3
  const animationSpeed = props.speed * 3;
  
  const animate = (timestamp) => {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;
    
    // Only update if enough time has passed based on animation speed
    if (elapsed >= animationSpeed) {
      lastFrameTime = timestamp;
      
      if (props.sequential) {
        if (revealedIndices.value.size < props.text.length) {
          const nextIndex = getNextIndex(revealedIndices.value);
          const newRevealed = new Set(revealedIndices.value);
          newRevealed.add(nextIndex);
          revealedIndices.value = newRevealed;
          displayText.value = shuffleText(props.text, newRevealed);
          animationId = requestAnimationFrame(animate);
        } else {
          isScrambling.value = false;
          animationId = null;
        }
      } else {
        displayText.value = shuffleText(props.text, revealedIndices.value);
        currentIteration++;
        if (currentIteration >= props.maxIterations) {
          isScrambling.value = false;
          displayText.value = props.text;
          animationId = null;
        } else {
          animationId = requestAnimationFrame(animate);
        }
      }
    } else {
      // Continue animation even if we haven't hit the speed threshold
      animationId = requestAnimationFrame(animate);
    }
  };
  
  animationId = requestAnimationFrame(animate);
};

const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  displayText.value = props.text;
  revealedIndices.value = new Set();
  isScrambling.value = false;
};

// Function to run animation automatically
const setupAutoAnimation = () => {
  // Only set up if autoAnimate is true
  if (!props.autoAnimate) return;
  
  // Clear any existing interval
  if (autoAnimateInterval) {
    clearInterval(autoAnimateInterval);
  }
  
  // Set up new interval to trigger animation every X milliseconds (default 2000ms)
  autoAnimateInterval = setInterval(() => {
    // Only trigger if not already animating
    if (!isScrambling.value) {
      // Run animation
      setIsHovering(true);
      
      // Reset after animation completes
      const totalDuration = props.sequential 
        ? props.text.length * props.speed * 3 + 200 // Add buffer time
        : props.maxIterations * props.speed * 3 + 200;
        
      setTimeout(() => {
        // Only reset if not currently being hovered
        if (!containerRef.value?.matches(':hover')) {
          setIsHovering(false);
        }
      }, totalDuration);
    }
  }, props.autoAnimateInterval);
};

onMounted(() => {
  // Calculate font size
  calculateFontSize();
  
  // Use resize observer instead of window resize event for better performance
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(debounce(() => {
      calculateFontSize();
    }, 100));
    
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value);
    }
    
    // Also observe window resize for orientation changes
    window.addEventListener('resize', debounce(() => {
      calculateFontSize();
    }, 100));
    
    // Handle orientation change specifically
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        calculateFontSize();
      }, 200);
    });
  } else {
    // Fallback to window resize event
    window.addEventListener('resize', calculateFontSize);
  }
  
  // Always trigger initial animation on mount with a short delay
  setTimeout(() => {
    setIsHovering(true);
    
    // For view-based animations, mark as animated
    if (props.animateOn === 'view') {
      hasAnimated.value = true;
    }
    // For hover-based animations, reset after animation completes
    else if (props.animateOn === 'hover') {
      // Calculate total animation time based on sequential or not
      const totalDuration = props.sequential 
        ? props.text.length * props.speed * 3 + 500 // Add buffer time
        : props.maxIterations * props.speed * 3 + 500;
        
      setTimeout(() => {
        // Only reset if not currently being hovered
        if (!containerRef.value?.matches(':hover')) {
          setIsHovering(false);
        }
      }, totalDuration);
    }
    
    // Set up automatic animation
    setupAutoAnimation();
  }, 500);
  
  // Set up intersection observer for view-based animations
  if (props.animateOn === 'view') {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.value) {
            setIsHovering(true);
            hasAnimated.value = true;
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    if (containerRef.value) {
      observer.observe(containerRef.value);
    }

    return () => {
      if (containerRef.value) {
        observer.unobserve(containerRef.value);
      }
    };
  }
});

// Simple debounce function to limit resize calculations
function debounce(fn, delay) {
  let timer = null;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // Clean up auto animation interval
  if (autoAnimateInterval) {
    clearInterval(autoAnimateInterval);
  }
  
  // Clean up event listeners
  window.removeEventListener('resize', calculateFontSize);
  window.removeEventListener('orientationchange', calculateFontSize);
});

// Reset animation when text changes
watch(() => props.text, (newText) => {
  displayText.value = newText;
  revealedIndices.value = new Set();
  calculateFontSize();
  if (isHovering.value) {
    startAnimation();
  }
});
</script>

<style lang="scss" scoped>
.decrypted-text-wrapper {
  display: inline-block;
  white-space: nowrap; /* Prevent text from wrapping */
  font-family: $poppins-extra-bold;
  color: v-bind(textColor);
  text-transform: uppercase;
  line-height: 1;
  width: 100%;
  cursor: pointer;
  overflow: visible; /* Allow characters to overflow if needed */
  
  span {
    display: inline-block;
    transition: color 0.5s ease-out, transform 0.5s ease-out, opacity 0.5s ease-out;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}

// Default styles for revealed characters
.first-name, .last-name {
  color: v-bind(textColor);
  font-weight: bold;
  transform: scale(1);
  opacity: 1;
}

// Styles for encrypted characters
.encrypted {
  color: $red;
  opacity: 0.8;
  transform: scale(1.1);
  text-shadow: 0 0 5px rgba(255, 0, 0, 0.3);
}

// Media query for tablet and up
@media (min-width: 768px) {
  .decrypted-text-wrapper {
    letter-spacing: 0.02em;
  }
  
  .encrypted {
    transform: scale(1.15);
    text-shadow: 0 0 8px rgba(255, 0, 0, 0.4);
  }
}

// Mobile specific styles
@media (max-width: 767px) {
  .decrypted-text-wrapper {
    letter-spacing: -0.02em; /* Tighten letter spacing on mobile */
    max-width: 100%; /* Ensure it doesn't exceed container width */
  }
}
</style> 