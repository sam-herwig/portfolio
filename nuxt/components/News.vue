<template>
  <section class="news-section pad-bl">
  <div class="news-section-inner"> 
    <NuxtLink
      v-for="(item, index) in projects"
      class="list-item"
      :to="`/${item.slug.current}`"
      :key="index"
    >
      <div class="gutter">
        <p class="fs-p1">{{ item.title }}</p>
      </div>
    </NuxtLink>
   </div>
  </section>
</template>

<script setup>
// Props
const props = defineProps({
  title: {
    type: String
  },
  projects: {
    type: Array
  }
});
</script>