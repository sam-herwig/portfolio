<template>
  <div class="menu-wrap" :style="containerStyles" ref="menuWrap">
    <div class="menu-header" v-if="enableTags">
      <div class="menu-tags">
        <button 
          class="tag" 
          :class="{ active: activeTag === null }"
          @click="setActiveTag(null)"
        >
          ALL
        </button>
        <button 
          v-for="tag in availableTags" 
          :key="tag"
          class="tag" 
          :class="{ active: activeTag === tag }"
          @click="setActiveTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>
    
    <nav class="menu">
      <div 
        v-for="(item, idx) in filteredItems" 
        :key="idx" 
        class="menu__item"
        :ref="el => { if (el) menuItemsRefs[idx] = el }"
      >
        <NuxtLink
          class="menu__item-link"
          :to="item.link"
          :style="{ color: textColor }"
          @mouseenter="handleMouseEnter($event, idx)"
          @mouseleave="handleMouseLeave($event, idx)"
        >
          {{ item.text }}
        </NuxtLink>
        <div class="marquee" :ref="el => { if (el) marqueeRefs[idx] = el }">
          <div class="marquee__inner-wrap" :ref="el => { if (el) marqueeInnerRefs[idx] = el }">
            <div class="marquee__inner" aria-hidden="true">
              <template v-for="(_, i) in 4" :key="i">
                <span>{{ item.text }}</span>
                <div
                  class="marquee__img"
                  :style="{ backgroundImage: `url(${item.image})` }"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  projects: {
    type: Array,
    required: true
  },
  backgroundColor: {
    type: String,
    default: 'black'
  },
  textColor: {
    type: String,
    default: 'white'
  },
  enableTags: {
    type: Boolean,
    default: true
  },
  height: {
    type: String,
    default: '70vh'
  }
});

const menuWrap = ref(null);
const containerStyles = computed(() => {
  return {
    backgroundColor: getColorValue(props.backgroundColor),
    height: props.height
  };
});

const getColorValue = (colorName) => {
  const colorMap = {
    'black': '#000000',
    'dark-black': '#1a1a1a',
    'red': '#e94234',
    'white': '#ffffff'
  };
  
  return colorMap[colorName] || colorName;
};

const activeTag = ref(null);
const isMobile = ref(false);
const lastScrollY = ref(0);
const activeMarqueeIndex = ref(null);

const availableTags = computed(() => {
  const tags = new Set();
  props.projects.forEach(project => {
    if (project.tags && Array.isArray(project.tags)) {
      project.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags);
});

const setActiveTag = (tag) => {
  activeTag.value = tag;
};

const items = computed(() => {
  return props.projects.map(project => ({
    text: project.title,
    link: `/${project.slug.current}`,
    image: project.cursorImage || '/static/svgs/hero-logo.svg',
    tags: project.tags
  }));
});

const filteredItems = computed(() => {
  if (activeTag.value === null) {
    return items.value;
  }
  return items.value.filter(item => 
    item.tags && Array.isArray(item.tags) && item.tags.includes(activeTag.value)
  );
});

const menuItemsRefs = ref({});
const marqueeRefs = ref({});
const marqueeInnerRefs = ref({});

const animationDefaults = { duration: 0.6, ease: 'expo' };

const findClosestEdge = (mouseX, mouseY, width, height) => {
  const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
  const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
  return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
};

const distMetric = (x, y, x2, y2) => {
  const xDiff = x - x2;
  const yDiff = y - y2;
  return xDiff * xDiff + yDiff * yDiff;
};

const handleMouseEnter = (ev, idx) => {
  if (isMobile.value) return; // Skip on mobile as we'll use scroll instead
  
  if (!menuItemsRefs.value[idx] || !marqueeRefs.value[idx] || !marqueeInnerRefs.value[idx]) return;
  
  const rect = menuItemsRefs.value[idx].getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  const edge = findClosestEdge(x, y, rect.width, rect.height);

  gsap.timeline({ defaults: animationDefaults })
    .set(marqueeRefs.value[idx], { y: edge === 'top' ? '-101%' : '101%' }, 0)
    .set(marqueeInnerRefs.value[idx], { y: edge === 'top' ? '101%' : '-101%' }, 0)
    .to([marqueeRefs.value[idx], marqueeInnerRefs.value[idx]], { y: '0%' }, 0);
};

const handleMouseLeave = (ev, idx) => {
  if (isMobile.value) return; // Skip on mobile as we'll use scroll instead
  
  if (!menuItemsRefs.value[idx] || !marqueeRefs.value[idx] || !marqueeInnerRefs.value[idx]) return;
  
  const rect = menuItemsRefs.value[idx].getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  const edge = findClosestEdge(x, y, rect.width, rect.height);

  gsap.timeline({ defaults: animationDefaults })
    .to(marqueeRefs.value[idx], { y: edge === 'top' ? '-101%' : '101%' }, 0)
    .to(marqueeInnerRefs.value[idx], { y: edge === 'top' ? '101%' : '-101%' }, 0);
};

const handleScroll = () => {
  if (!isMobile.value || !menuWrap.value) return;
  
  const currentScrollY = window.scrollY;
  const scrollDirection = currentScrollY > lastScrollY.value ? 'down' : 'up';
  lastScrollY.value = currentScrollY;
  
  // Get all menu items that are in viewport
  const menuItems = Object.entries(menuItemsRefs.value);
  if (!menuItems.length) return;
  
  // Find the most visible menu item
  let mostVisibleIdx = null;
  let maxVisibility = 0;
  
  menuItems.forEach(([idx, el]) => {
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate how much of the element is visible
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(windowHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibilityRatio = visibleHeight / rect.height;
    
    if (visibilityRatio > maxVisibility) {
      maxVisibility = visibilityRatio;
      mostVisibleIdx = parseInt(idx);
    }
  });
  
  // If we found a visible item and it's different from the current active one
  if (mostVisibleIdx !== null && mostVisibleIdx !== activeMarqueeIndex.value && maxVisibility > 0.5) {
    // Hide previous active marquee if exists
    if (activeMarqueeIndex.value !== null && 
        marqueeRefs.value[activeMarqueeIndex.value] && 
        marqueeInnerRefs.value[activeMarqueeIndex.value]) {
      
      gsap.timeline({ defaults: animationDefaults })
        .to(marqueeRefs.value[activeMarqueeIndex.value], { y: scrollDirection === 'down' ? '101%' : '-101%' }, 0)
        .to(marqueeInnerRefs.value[activeMarqueeIndex.value], { y: scrollDirection === 'down' ? '-101%' : '101%' }, 0);
    }
    
    // Show new active marquee
    if (marqueeRefs.value[mostVisibleIdx] && marqueeInnerRefs.value[mostVisibleIdx]) {
      gsap.timeline({ defaults: animationDefaults })
        .set(marqueeRefs.value[mostVisibleIdx], { y: scrollDirection === 'down' ? '-101%' : '101%' }, 0)
        .set(marqueeInnerRefs.value[mostVisibleIdx], { y: scrollDirection === 'down' ? '101%' : '-101%' }, 0)
        .to([marqueeRefs.value[mostVisibleIdx], marqueeInnerRefs.value[mostVisibleIdx]], { y: '0%' }, 0);
    }
    
    activeMarqueeIndex.value = mostVisibleIdx;
  }
};

const checkIfMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  if (process.client) {
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('resize', checkIfMobile);
    window.removeEventListener('scroll', handleScroll);
  }
});

watch(() => filteredItems.value, () => {
  menuItemsRefs.value = {};
  marqueeRefs.value = {};
  marqueeInnerRefs.value = {};
  activeMarqueeIndex.value = null;
}, { deep: true });
</script>

<style lang="scss">
.menu-wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: $black; /* Default, will be overridden by inline style */
}

.menu-header {
  padding: 1rem 2rem;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  
  .menu-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    
    .tag {
      padding: 0.5rem 1rem;
      border: 1px solid $red;
      border-radius: 2rem;
      font-family: $poppins-semi-bold;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.3s, color 0.3s;
      color: $white;
      background-color: transparent;
      
      &:hover {
        background-color: rgba($red, 0.1);
      }
      
      &.active {
        background-color: $red;
        color: $white;
      }
    }
  }
}

.menu {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 0;
  padding: 0;
}

.menu__item {
  flex: 1;
  position: relative;
  overflow: hidden;
  text-align: center;
  box-shadow: 0 -1px rgba(255, 255, 255, 0.3);
  
  &:last-child {
    box-shadow: 0 -1px rgba(255, 255, 255, 0.3), 0 1px rgba(255, 255, 255, 0.3);
  }
}

.menu__item-link {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
  cursor: pointer;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  font-family: $poppins-extra-bold;
  font-weight: 600;
  color: $white; /* Default, will be overridden by inline style */
  font-size: 4vh;
  transition: color 0.3s ease;
  
  &:hover {
    color: $red !important;
  }
}

.marquee {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: $white;
  transform: translate3d(0, 101%, 0);
}

.marquee__inner-wrap {
  height: 100%;
  width: 200%;
  display: flex;
}

.marquee__inner {
  display: flex;
  align-items: center;
  position: relative;
  height: 100%;
  width: 200%;
  will-change: transform;
  animation: marquee 15s linear infinite;
}

.marquee span {
  color: $black;
  white-space: nowrap;
  text-transform: uppercase;
  font-family: $poppins-semi-bold;
  font-weight: 400;
  font-size: 4vh;
  line-height: 1.2;
  padding: 1vh 1vw 0;
}

.marquee__img {
  width: 200px;
  height: 5vh;
  margin: 2em 2vw;
  padding: 1em 0;
  border-radius: 50px;
  background-size: cover;
  background-position: 50% 50%;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .menu-header {
    padding: 1rem;
    
    .menu-tags {
      .tag {
        padding: 0.4rem 0.8rem;
        font-size: 0.75rem;
      }
    }
  }
  
  .menu__item-link {
    font-size: 3vh;
  }
  
  .marquee span {
    font-size: 3vh;
  }
  
  .marquee__img {
    width: 150px;
    height: 5vh;
    margin: 1em 1vw;
  }
}
</style> 