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
    
    <!-- Preview mode indicator -->
    <div v-if="isPreviewMode" class="preview-indicator">
      Preview Mode
      <button @click="exitPreview" class="exit-preview-btn">Exit</button>
    </div>
  </div>
</template>

<script setup>
import { useSiteStore } from '~/stores/store';
import { useCookie } from '#app';

const store = useSiteStore();
const config = useRuntimeConfig();
const previewCookie = useCookie('preview');
const isPreviewMode = computed(() => previewCookie.value === 'true');
const router = useRouter();

// Debug runtime config
console.log('Runtime config:', {
  projectId: config.public.sanity?.projectId,
  siteUrl: config.public.siteUrl,
  isDev: config.public.isDev
});

// Composables
useSeoMeta({
  title: store.site_name,
  ogTitle: store.site_name,
  description: store.site_seo_description,
  ogDescription: store.site_seo_description,
  ogImage: store.site_seo_image
});

// Exit preview mode
const exitPreview = async () => {
  try {
    await $fetch('/api/disable-preview');
    previewCookie.value = null;
    // Reload the page to exit preview mode
    window.location.reload();
  } catch (error) {
    console.error('Failed to exit preview mode:', error);
  }
};

// Mounted
onMounted(() => {
  window.addEventListener('resize', onResize);
  onResize();
  
  // Initialize store
  store.fetchSiteContent();
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

// Preview mode indicator
.preview-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #ff3e00;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
}

.exit-preview-btn {
  background-color: white;
  color: #ff3e00;
  border: none;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
}
</style>
