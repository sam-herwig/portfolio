<template>
  <section id="projects" class="projects-section">
    <div class="projects-header">
      <h2 class="projects-title">PROJECTS</h2>
      <div class="projects-tags">
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
    
    <div class="projects-divider"></div>
    
    <div class="projects-grid">
      <div 
        v-for="project in filteredProjects" 
        :key="project.slug?.current || project._id" 
        class="project-item"
        @mouseover="changeCursor(project.cursorImage)"
        @mouseleave="resetCursor()"
      >
        <NuxtLink :to="`/${project.slug.current}`" class="project-link">
          <div class="project-title" :class="project.titleClass">{{ project.title }}</div>
          <div class="project-subtitle">{{ project.subtitle }}</div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { throttle } from 'lodash';

// Props
const props = defineProps({
  projects: {
    type: Array,
    required: true
  }
});

// Debug logging removed for production

// Tag filtering
const activeTag = ref(null);
const availableTags = computed(() => {
  // Extract unique tags from all projects
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

const filteredProjects = computed(() => {
  if (activeTag.value === null) {
    return props.projects;
  }
  return props.projects.filter(project => 
    project.tags && Array.isArray(project.tags) && project.tags.includes(activeTag.value)
  );
});

const setActiveTag = (tag) => {
  activeTag.value = tag;
};

// Custom cursor functionality
const originalCursor = ref('');
const cursorImage = ref(null);

onMounted(() => {
  // Store the original cursor style
  originalCursor.value = document.body.style.cursor;
  
  // Create a cursor image element that will follow the mouse
  cursorImage.value = document.createElement('div');
  cursorImage.value.classList.add('custom-cursor');
  cursorImage.value.style.position = 'fixed';
  cursorImage.value.style.pointerEvents = 'none';
  cursorImage.value.style.zIndex = '9999';
  cursorImage.value.style.width = '200px'; // 2x bigger
  cursorImage.value.style.height = '200px'; // 2x bigger
  cursorImage.value.style.backgroundSize = 'contain';
  cursorImage.value.style.backgroundRepeat = 'no-repeat';
  cursorImage.value.style.backgroundPosition = 'center';
  cursorImage.value.style.transform = 'translate(-50%, -50%)';
  cursorImage.value.style.display = 'none';
  cursorImage.value.style.opacity = '0.9'; // Add opacity
  document.body.appendChild(cursorImage.value);
  
  // Add mouse move event listener
  document.addEventListener('mousemove', updateCursorPosition);
});

onUnmounted(() => {
  // Clean up
  document.removeEventListener('mousemove', updateCursorPosition);
  if (cursorImage.value && cursorImage.value.parentNode) {
    cursorImage.value.parentNode.removeChild(cursorImage.value);
  }
  resetCursor();
});

// Update cursor position to follow mouse - throttled for performance
const updateCursorPosition = throttle((e) => {
  if (cursorImage.value) {
    cursorImage.value.style.left = `${e.clientX}px`;
    cursorImage.value.style.top = `${e.clientY}px`;
  }
}, 16); // ~60fps

// Change cursor when hovering over a project
const changeCursor = (imageUrl) => {
  // Only apply custom cursor on desktop
  if (window.innerWidth >= 768) {
    // Use pointer cursor instead of hiding it to maintain clickability
    document.body.style.cursor = 'pointer';
    if (cursorImage.value) {
      cursorImage.value.style.backgroundImage = `url(${imageUrl})`;
      cursorImage.value.style.display = 'block';
    }
  }
};

// Reset cursor when leaving a project
const resetCursor = () => {
  document.body.style.cursor = originalCursor.value;
  if (cursorImage.value) {
    cursorImage.value.style.display = 'none';
  }
};
</script>

<style lang="scss">
.projects-section {
  padding: 4rem 0;
  background-color: $black;
  color: $white;
  
  .projects-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4rem;
    margin-bottom: 2rem;
    
    @media (max-width: 767px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
    }
    
    .projects-title {
      font-family: $poppins-extra-bold;
      font-size: 3rem;
      margin: 0;
    }
    
    .projects-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      
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
  
  .projects-divider {
    height: 1px;
    background-color: $red;
    margin: 2rem 0;
  }
  
  .projects-grid {
    padding: 2rem 4rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4rem;
    
    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: 767px) {
      grid-template-columns: 1fr;
      padding: 2rem;
    }
    
    .project-item {
      position: relative;
      
      .project-link {
        text-decoration: none;
        color: inherit;
        display: block;
        position: relative;
        z-index: 10;
        cursor: pointer;
      }
      
      .project-title {
        font-family: $poppins-extra-bold;
        font-size: 4rem;
        line-height: 1;
        margin-bottom: 0.5rem;
        
        &.red {
          color: $red;
        }
      }
      
      .project-subtitle {
        font-family: $poppins-semi-bold;
        font-size: 1rem;
        opacity: 0.8;
      }
    }
  }
}
</style>
