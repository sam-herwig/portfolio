<template>
  <div class="expandable-gallery">
    <div class="gallery-container">
      <NuxtLink
        v-for="(project, index) in projects"
        :key="project.slug?.current || index"
        :to="`/${project.slug?.current}`"
        class="gallery-item"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
      >
        <img
          v-if="project.featuredImage"
          class="gallery-image"
          :src="project.featuredImage"
          :alt="project.title"
        />
        <div 
          class="gallery-overlay"
          :class="{ active: hoveredIndex === index }"
        >
          <h3 class="gallery-title">{{ project.title }}</h3>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  projects: {
    type: Array,
    required: true
  }
});

const hoveredIndex = ref(null);
</script>

<style lang="scss" scoped>
.expandable-gallery {
  width: 100%;
  padding: 2rem;
}

.gallery-container {
  display: flex;
  height: 400px;
  width: 100%;
  gap: 0.5rem;
}

.gallery-item {
  position: relative;
  flex: 1;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
  border-radius: $radius-m;
  transition: flex 0.5s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    flex: 3;
  }
}

.gallery-image {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 50%);
  display: flex;
  align-items: flex-end;
  padding: 2rem 1.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.active {
    opacity: 1;
  }
}

.gallery-title {
  color: $white;
  font-family: $poppins-semi-bold;
  font-size: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

@media (max-width: 768px) {
  .expandable-gallery {
    padding: 1rem;
  }
  
  .gallery-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 220px;
    height: auto;
    gap: 0.25rem;
  }
  
  .gallery-item {
    border-radius: $radius-s;
    flex: initial;
    transition: none;
  }
  
  .gallery-overlay {
    padding: 1rem;
  }
  
  .gallery-title {
    font-size: 1rem;
  }
}
</style>
