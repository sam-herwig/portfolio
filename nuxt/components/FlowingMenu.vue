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
      <MarqueeItem
        v-for="(item, idx) in filteredItems" 
        :key="item.link || idx"
        :text="item.text"
        :linkTo="item.link"
        :image="item.image"
        :textColor="textColor"
        class="menu__item"
        ref="menuItems"
      />
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { gsap } from 'gsap';
import { throttle } from 'lodash';
import MarqueeItem from './MarqueeItem.vue';

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
const menuItems = ref([]);
const containerStyles = computed(() => {
  return {
    backgroundColor: getColorValue(props.backgroundColor),
    height: props.height
  };
});

const getColorValue = (colorName) => {
  const colorMap = {
    'black': '#000000',
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
      project.tags.forEach(tag => {
        // Exclude "Climber" tag from the menu
        if (tag !== 'Climber') {
          tags.add(tag);
        }
      });
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

const handleScroll = throttle(() => {
  if (!isMobile.value || !menuWrap.value || !menuItems.value.length) return;
  
  const currentScrollY = window.scrollY;
  const scrollDirection = currentScrollY > lastScrollY.value ? 'down' : 'up';
  lastScrollY.value = currentScrollY;
  
  // Find the most visible menu item
  let mostVisibleIdx = null;
  let maxVisibility = 0;
  
  menuItems.value.forEach((item, idx) => {
    if (!item || !item.$el) return;
    
    const rect = item.$el.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate how much of the element is visible
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(windowHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibilityRatio = visibleHeight / rect.height;
    
    if (visibilityRatio > maxVisibility) {
      maxVisibility = visibilityRatio;
      mostVisibleIdx = idx;
    }
  });
  
  // If we found a visible item and it's different from the current active one
  if (mostVisibleIdx !== null && mostVisibleIdx !== activeMarqueeIndex.value && maxVisibility > 0.5) {
    // Hide previous active marquee if exists
    if (activeMarqueeIndex.value !== null && menuItems.value[activeMarqueeIndex.value]) {
      menuItems.value[activeMarqueeIndex.value].hideMarquee(scrollDirection);
    }
    
    // Show new active marquee
    if (menuItems.value[mostVisibleIdx]) {
      menuItems.value[mostVisibleIdx].showMarquee(scrollDirection);
    }
    
    activeMarqueeIndex.value = mostVisibleIdx;
  }
}, 100); // Throttle to 100ms for smooth scrolling performance

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
      font-family: $poppins-semi-bold;
      @include pill($red, $white);
      cursor: pointer;
      transition: background-color 0.3s, color 0.3s;
      
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
  position: relative;
  z-index: 1;
  
  &:last-child {
    box-shadow: 0 -1px rgba(255, 255, 255, 0.3), 0 1px rgba(255, 255, 255, 0.3);
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
}
</style> 
