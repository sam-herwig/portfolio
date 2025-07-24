<template>
  <div
    ref="containerRef"
    :class="['falling-text-container', className]"
    @click="trigger === 'click' ? handleTrigger : undefined"
    @mouseenter="trigger === 'hover' ? handleTrigger : undefined"
    :style="{
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      minHeight: '400px'
    }"
  >
    <div
      ref="textRef"
      class="falling-text-target"
      :style="{
        fontSize: fontSize,
        lineHeight: 1.4,
      }"
    />
    <div ref="canvasContainerRef" class="falling-text-canvas" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import Matter from 'matter-js';

const props = defineProps({
  className: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  highlightWords: {
    type: Array,
    default: () => []
  },
  highlightClass: {
    type: String,
    default: 'highlighted'
  },
  trigger: {
    type: String,
    default: 'auto',
    validator: (value) => ['auto', 'hover', 'click', 'scroll'].includes(value)
  },
  backgroundColor: {
    type: String,
    default: 'transparent'
  },
  wireframes: {
    type: Boolean,
    default: false
  },
  gravity: {
    type: Number,
    default: 1
  },
  mouseConstraintStiffness: {
    type: Number,
    default: 0.2
  },
  fontSize: {
    type: String,
    default: '1rem'
  }
});

const containerRef = ref(null);
const textRef = ref(null);
const canvasContainerRef = ref(null);
const effectStarted = ref(false);

let engine = null;
let render = null;
let runner = null;
let animationId = null;
let observer = null;

// Update text with highlighted words
const updateTextHTML = () => {
  if (!textRef.value || !props.text) return;
  const words = props.text.split(' ').filter(word => word.trim() !== '');
  const newHTML = words
    .map((word) => {
      const isHighlighted = props.highlightWords.some((hw) => word.toLowerCase().includes(hw.toLowerCase()));
      return `<span class="word ${isHighlighted ? props.highlightClass : ''}">${word}</span>`;
    })
    .join(' ');
  textRef.value.innerHTML = newHTML;
};

// Initialize trigger based on prop
const initializeTrigger = () => {
  if (props.trigger === 'auto') {
    effectStarted.value = true;
    return;
  }
  
  if (props.trigger === 'scroll' && containerRef.value) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          effectStarted.value = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.value);
  }
};

// Start the falling text effect
const startEffect = async () => {
  if (!effectStarted.value || !containerRef.value || !textRef.value || !canvasContainerRef.value) return;

  await nextTick();

  const {
    Engine,
    Render,
    World,
    Bodies,
    Runner,
    Mouse,
    MouseConstraint,
  } = Matter;

  const containerRect = containerRef.value.getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height;

  if (width <= 0 || height <= 0) {
    return;
  }

  engine = Engine.create();
  engine.world.gravity.y = props.gravity;

  render = Render.create({
    element: canvasContainerRef.value,
    engine,
    options: {
      width,
      height,
      background: props.backgroundColor,
      wireframes: props.wireframes,
    },
  });

  const boundaryOptions = {
    isStatic: true,
    render: { fillStyle: 'transparent' },
  };
  
  const floor = Bodies.rectangle(width / 2, height + 25, width, 50, boundaryOptions);
  const leftWall = Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions);
  const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, boundaryOptions);
  const ceiling = Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions);

  const wordSpans = textRef.value.querySelectorAll('.word');
  const wordBodies = [...wordSpans].map((elem) => {
    const rect = elem.getBoundingClientRect();

    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + rect.height / 2;

    const body = Bodies.rectangle(x, y, rect.width, rect.height, {
      render: { fillStyle: 'transparent' },
      restitution: 0.8,
      frictionAir: 0.01,
      friction: 0.2,
    });

    Matter.Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 5,
      y: 0
    });
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
    return { elem, body };
  });

  wordBodies.forEach(({ elem, body }) => {
    elem.style.position = 'absolute';
    elem.style.left = `${body.position.x - body.bounds.max.x + body.bounds.min.x / 2}px`;
    elem.style.top = `${body.position.y - body.bounds.max.y + body.bounds.min.y / 2}px`;
    elem.style.transform = 'none';
  });

  const mouse = Mouse.create(containerRef.value);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: props.mouseConstraintStiffness,
      render: { visible: false },
    },
  });
  render.mouse = mouse;

  World.add(engine.world, [
    floor,
    leftWall,
    rightWall,
    ceiling,
    mouseConstraint,
    ...wordBodies.map((wb) => wb.body),
  ]);

  runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  const updateLoop = () => {
    wordBodies.forEach(({ body, elem }) => {
      const { x, y } = body.position;
      elem.style.left = `${x}px`;
      elem.style.top = `${y}px`;
      elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
    });
    Matter.Engine.update(engine);
    animationId = requestAnimationFrame(updateLoop);
  };
  updateLoop();
};

const handleTrigger = () => {
  if (!effectStarted.value && (props.trigger === 'click' || props.trigger === 'hover')) {
    effectStarted.value = true;
  }
};

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  if (render) {
    Matter.Render.stop(render);
    if (render.canvas && render.canvas.parentNode) {
      render.canvas.parentNode.removeChild(render.canvas);
    }
  }
  
  if (runner) {
    Matter.Runner.stop(runner);
  }
  
  if (engine) {
    Matter.World.clear(engine.world);
    Matter.Engine.clear(engine);
  }
  
  if (observer) {
    observer.disconnect();
  }
};

// Watch for text changes
watch(() => props.text, () => {
  updateTextHTML();
});

// Watch for effect start
watch(effectStarted, (newVal) => {
  if (newVal) {
    startEffect();
  }
});

onMounted(() => {
  updateTextHTML();
  initializeTrigger();
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style lang="scss">
.falling-text-container {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  // padding: 2rem;
  // box-sizing: content-box;
  
  .falling-text-target {
    position: relative;
    z-index: 1;
    pointer-events: none;
    text-align: center;
    width: 100%;
    
    .word {
      display: inline-block;
      margin: 0.25rem;
      cursor: grab;
      pointer-events: auto;
      padding: 0.5rem 1rem;
      // background: rgba(255, 255, 255, 0.1);
      border-radius: 50px;
      color: $white;
      font-family: inherit;
      transition: color 333ms ease-in-out;
      
      &:active {
        cursor: grabbing;
        color: $red;
        font-weight: bold;
        // background: $white;
        transition: color 333ms ease-in-out
      }
      
      &.highlighted {
        color: $red;
        font-weight: bold;
        // background: rgba(255, 0, 0, 0.2);
      }
    }
  }
  
  .falling-text-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 0;
    
    canvas {
      position: absolute;
      top: 0;
      left: 0;
    }
  }
}
</style>