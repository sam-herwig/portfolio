<template>
  <div id="home-page" class="page space-t">
    <InteractiveHero />
    
    <!-- Flowing Menu Section -->
    <section 
      class="flowing-menu-section" 
      v-if="pageData && pageData.flowingMenu"
    >
      <h2 class="section-title">{{ pageData.flowingMenu.title || 'EXPLORE PROJECTS' }}</h2>
      <div 
        class="flowing-menu-container"
        :style="{ height: pageData.flowingMenu.height || '70vh' }"
      >
        <FlowingMenu
          :projects="pageData.flowingMenu.projects || pageData.projects"
          :backgroundColor="pageData.flowingMenu.backgroundColor || 'black'"
          :textColor="pageData.flowingMenu.textColor || 'white'"
          :enableTags="pageData.flowingMenu.enableTags !== false"
          :height="pageData.flowingMenu.height || '70vh'"
        />
      </div>
    </section>

    <!-- Contact Form Section -->
    <section class="container mx-auto px-4 py-12">
      <!-- <h2 class="text-3xl font-bold mb-8 text-center">Get In Touch</h2> -->
      <ContactForm />
    </section>

    <!-- Preview Mode Banner -->
    <div v-if="isPreview" class="preview-banner">
      <p>Preview Mode Active</p>
      <button @click="exitPreview">Exit Preview</button>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSiteStore } from '~/stores/store';
import { smoothScrollTo } from '~/utils/smooth-scroll-to';
import { typeFilter, imageProps } from '~/utils/groq-common';
import FlowingMenu from '~/components/FlowingMenu.vue';
import InteractiveHero from '~/components/InteractiveHero.vue';

const route = useRoute();
const router = useRouter();
const store = useSiteStore();
const pageData = ref(null);
const isPreview = ref(false);

const homeQuery = groq`*[(_type == "home")][0]{
  heroImage ${imageProps},
  heroTitle,
  heroSubtitle, 
  projects[]-> {
    title,
    subtitle,
    slug,
    titleClass,
    "cursorImage": cursorImage.asset->url,
    tags
  },
  flowingMenu {
    title,
    backgroundColor,
    textColor,
    enableTags,
    height,
    projects[]-> {
      title,
      subtitle,
      slug,
      titleClass,
      "cursorImage": cursorImage.asset->url,
      tags
    }
  }
}`;

// Function to fetch data
const fetchData = async () => {
  isPreview.value = route.query.preview === 'true';
  
  try {
    const data = await useSanityData({ 
      query: homeQuery, 
      preview: isPreview.value 
    });
    
    pageData.value = data;
  } catch (error) {
    console.error('Error fetching home data:', error);
  }
};

// Initialize data
await fetchData();

// Set up live preview updates
onMounted(() => {
  if (isPreview.value && process.client) {
    // Set up listener for content changes if in preview mode
    const { $sanity } = useNuxtApp();
    if ($sanity && $sanity.client) {
      const subscription = $sanity.client
        .listen(homeQuery)
        .subscribe(update => {
          if (update.result) {
            pageData.value = update.result;
          }
        });
      
      // Clean up subscription on component unmount
      onBeforeUnmount(() => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
    }
  }
});

// Exit preview mode
const exitPreview = () => {
  router.replace('/');
};
</script>

<style lang="scss">
.preview-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba($black, 0.8);
  color: $white;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  
  p {
    margin: 0;
  }
  
  button {
    background-color: $red;
    color: $white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: darken($red, 10%);
    }
  }
}

.flowing-menu-section {
  background-color: $black;
  color: $white;
  padding: 4rem 0;
  
  .section-title {
    font-family: $poppins-extra-bold;
    font-size: 3rem;
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .flowing-menu-container {
    height: 70vh;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
}
</style>
