<template>
  <div>
    <!-- <transition name="loading" :duration="2100">
      <Loader v-if="store.loading" />
    </transition> -->
    <!-- <DevOnly>
      <GridOverlay />
    </DevOnly> -->
    <Header />
    <!-- <transition :name="store.page_mask_name">
      <PageMask v-if="store.page_mask" />
    </transition> -->
    <!-- <transition name="menu">
      <Menu v-if="store.menu_open" />
    </transition> -->
    <NuxtPage />
  </div>
</template>

<script setup>
import { useSiteStore } from '~/stores/store';

const store = useSiteStore();

// Composables
useSeoMeta({
  title: store.site_name,
  ogTitle: store.site_name,
  description: store.site_seo_description,
  ogDescription: store.site_seo_description,
  ogImage: store.site_seo_image
})

// Mounted
onMounted(() => {
  window.addEventListener('resize', onResize);
  onResize();
});

// Before Unmount
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});

// Methods
function onResize() {
  updateScrollbarWidth();
};

function updateScrollbarWidth() {
  // NOTE: Store scrollbar width in css custom property to calculate grid spans properly
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
};
</script>

<style lang='scss'>
// Default page transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity $speed-666 $evil-ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Directional page transition
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform $speed-666 $evil-ease;
}

.slide-left-enter-from,
.slide-right-leave-to {
  transform: translateX(#{span(2)});
}

.slide-right-enter-from,
.slide-left-leave-to {
  transform: translateX(#{span(-2)});
}
</style>
