<template>
  <div
    ref="containerRef"
    class="text-pressure-container"
  >
    <h1
      ref="titleRef"
      :class="`text-pressure-title ${dynamicClassName}`"
      :style="{
        textTransform: 'uppercase',
        fontSize: `${fontSize}px`,
        lineHeight,
        transform: `scale(1, ${scaleY})`,
        transformOrigin: 'center top',
        margin: 0,
        textAlign: 'left',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        width: '100%',
      }"
    >
      <span
        v-for="(char, i) in chars"
        :key="i"
        :ref="el => { if (el) spansRef[i] = el }"
        :data-char="char"
        :style="{
          display: 'inline-block',
          color: textColor
        }"
      >
        {{ char }}
      </span>
    </h1>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: 'Compressa'
  },
  width: {
    type: Boolean,
    default: true
  },
  weight: {
    type: Boolean,
    default: true
  },
  italic: {
    type: Boolean,
    default: true
  },
  alpha: {
    type: Boolean,
    default: false
  },
  flex: {
    type: Boolean,
    default: true
  },
  stroke: {
    type: Boolean,
    default: false
  },
  scale: {
    type: Boolean,
    default: false
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  className: {
    type: String,
    default: ''
  },
  minFontSize: {
    type: Number,
    default: 24
  }
});

const containerRef = ref(null);
const titleRef = ref(null);
const spansRef = ref([]);

const mouseRef = ref({ x: 0, y: 0 });
const cursorRef = ref({ x: 0, y: 0 });

const fontSize = ref(props.minFontSize);
const scaleY = ref(1);
const lineHeight = ref(1);

const chars = computed(() => props.text.split(''));

const dynamicClassName = computed(() => {
  return [props.className, props.flex ? 'flex' : '', props.stroke ? 'stroke' : '']
    .filter(Boolean)
    .join(' ');
});

const dist = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const setSize = () => {
  if (!containerRef.value || !titleRef.value) return;

  const { width: containerW, height: containerH } = containerRef.value.getBoundingClientRect();

  let newFontSize = containerW / (chars.value.length / 1.5);
  newFontSize = Math.max(newFontSize, props.minFontSize);

  fontSize.value = newFontSize;
  scaleY.value = 1;
  lineHeight.value = 1;

  requestAnimationFrame(() => {
    if (!titleRef.value) return;
    const textRect = titleRef.value.getBoundingClientRect();

    if (props.scale && textRect.height > 0) {
      const yRatio = containerH / textRect.height;
      scaleY.value = yRatio;
      lineHeight.value = yRatio;
    }
  });
};

let animationFrameId = null;

const animate = () => {
  mouseRef.value.x += (cursorRef.value.x - mouseRef.value.x) / 15;
  mouseRef.value.y += (cursorRef.value.y - mouseRef.value.y) / 15;

  if (titleRef.value) {
    const titleRect = titleRef.value.getBoundingClientRect();
    const maxDist = titleRect.width / 2;

    spansRef.value.forEach((span) => {
      if (!span) return;

      const rect = span.getBoundingClientRect();
      const charCenter = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };

      const d = dist(mouseRef.value, charCenter);

      const getAttr = (distance, minVal, maxVal) => {
        const val = maxVal - Math.abs((maxVal * distance) / maxDist);
        return Math.max(minVal, val + minVal);
      };

      // Calculate scale based on distance - max scale of 1.2x
      const scale = props.width ? getAttr(d, 1.0, 1.2) : 1.0;
      
      // Apply alpha if enabled
      const alphaVal = props.alpha ? getAttr(d, 0, 1).toFixed(2) : 1;

      // Apply the effects
      span.style.opacity = alphaVal;
      span.style.transform = `scale(${scale})`;
      span.style.color = props.textColor;
      span.style.transition = 'transform 0.1s ease-out';
      span.style.display = 'inline-block';
      span.style.transformOrigin = 'center';
    });
  }

  animationFrameId = requestAnimationFrame(animate);
};

let handleMouseMove;
let handleTouchMove;

onMounted(() => {
  handleMouseMove = (e) => {
    cursorRef.value.x = e.clientX;
    cursorRef.value.y = e.clientY;
  };
  
  handleTouchMove = (e) => {
    const t = e.touches[0];
    cursorRef.value.x = t.clientX;
    cursorRef.value.y = t.clientY;
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove, { passive: false });

  if (containerRef.value) {
    const { left, top, width, height } = containerRef.value.getBoundingClientRect();
    mouseRef.value.x = left + width / 2;
    mouseRef.value.y = top + height / 2;
    cursorRef.value.x = mouseRef.value.x;
    cursorRef.value.y = mouseRef.value.y;
  }

  setSize();
  window.addEventListener('resize', setSize);
  
  animationFrameId = requestAnimationFrame(animate);
});

watch(() => props.text, setSize);
watch(() => props.scale, setSize);

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('resize', setSize);
});
</script>

<style lang="scss" scoped>
.text-pressure-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
}

.text-pressure-title {
  color: v-bind(textColor);
  font-family: $poppins-extra-bold;
}

.flex {
  display: flex;
  justify-content: flex-start;
}

.stroke span {
  position: relative;
}

.stroke span::after {
  content: attr(data-char);
  position: absolute;
  left: 0;
  top: 0;
  color: transparent;
  z-index: -1;
  -webkit-text-stroke-width: 3px;
  -webkit-text-stroke-color: #FF0000;
}
</style> 