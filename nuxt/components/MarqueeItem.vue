<template>
  <div class="marquee-item" ref="container">
    <component 
      :is="linkComponent"
      class="marquee-item__link"
      :to="linkTo"
      :href="linkHref"
      :style="{ color: textColor }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <slot name="link-content">{{ text }}</slot>
    </component>
    
    <div class="marquee" ref="marquee">
      <div class="marquee__inner-wrap" ref="marqueeInner">
        <div class="marquee__inner" aria-hidden="true">
          <template v-for="(_, i) in 6" :key="i">
            <span>{{ text }}</span>
            <div
              v-if="image"
              class="marquee__img"
              :style="{ backgroundImage: `url(${image})` }"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  linkTo: {
    type: String,
    default: ''
  },
  linkHref: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: null
  },
  textColor: {
    type: String,
    default: 'white'
  },
  useExternalLink: {
    type: Boolean,
    default: false
  }
});

// Refs for animation
const container = ref(null);
const marquee = ref(null);
const marqueeInner = ref(null);

// Determine which component to use for the link
const linkComponent = computed(() => {
  if (props.useExternalLink || !props.linkTo) {
    return props.linkHref ? 'a' : 'div';
  }
  return 'NuxtLink';
});

// Animation defaults
const animationDefaults = { duration: 0.6, ease: 'expo' };

// Find which edge of the element the mouse is closest to
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

// Mouse enter handler
const handleMouseEnter = (ev) => {
  if (!container.value || !marquee.value || !marqueeInner.value) return;
  
  const rect = container.value.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  const edge = findClosestEdge(x, y, rect.width, rect.height);

  gsap.timeline({ defaults: animationDefaults })
    .set(marquee.value, { y: edge === 'top' ? '-101%' : '101%' }, 0)
    .set(marqueeInner.value, { y: edge === 'top' ? '101%' : '-101%' }, 0)
    .to([marquee.value, marqueeInner.value], { y: '0%' }, 0);
};

// Mouse leave handler
const handleMouseLeave = (ev) => {
  if (!container.value || !marquee.value || !marqueeInner.value) return;
  
  const rect = container.value.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  const edge = findClosestEdge(x, y, rect.width, rect.height);

  gsap.timeline({ defaults: animationDefaults })
    .to(marquee.value, { y: edge === 'top' ? '-101%' : '101%' }, 0)
    .to(marqueeInner.value, { y: edge === 'top' ? '101%' : '-101%' }, 0);
};

// Expose methods that can be used by parent components
defineExpose({
  showMarquee: (direction = 'down') => {
    if (!marquee.value || !marqueeInner.value) return;
    
    gsap.timeline({ defaults: animationDefaults })
      .set(marquee.value, { y: direction === 'down' ? '-101%' : '101%' }, 0)
      .set(marqueeInner.value, { y: direction === 'down' ? '101%' : '-101%' }, 0)
      .to([marquee.value, marqueeInner.value], { y: '0%' }, 0);
  },
  hideMarquee: (direction = 'down') => {
    if (!marquee.value || !marqueeInner.value) return;
    
    gsap.timeline({ defaults: animationDefaults })
      .to(marquee.value, { y: direction === 'down' ? '101%' : '-101%' }, 0)
      .to(marqueeInner.value, { y: direction === 'down' ? '-101%' : '101%' }, 0);
  }
});
</script>

<style lang="scss">
.marquee-item {
  flex: 1;
  position: relative;
  overflow: hidden;
  text-align: center;
  
  &:not(:first-child) {
    box-shadow: 0 -1px rgba(255, 255, 255, 0.3);
  }
}

.marquee-item__link {
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
  color: $white;
  font-size: 4vh;
  transition: color 0.3s ease;
  z-index: 10;
  
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
  z-index: 2;
}

.marquee__inner-wrap {
  height: 100%;
  width: 100%;
  display: flex;
}

.marquee__inner {
  display: flex;
  align-items: center;
  position: relative;
  height: 100%;
  width: fit-content;
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
  .marquee-item__link {
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