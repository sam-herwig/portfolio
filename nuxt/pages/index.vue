<template>
  <div id="home-page" class="page space-t">
    <InteractiveHero />
    
    <!-- Expandable Gallery Section -->
    <section 
      class="expandable-gallery-section section-pad" 
      v-if="pageData && pageData.expandableGallery"
    >
      <h2 class="section-title">{{ pageData.expandableGallery.title || 'FEATURED WORK' }}</h2>
      <ExpandableGallery
        :projects="expandableGalleryProjects"
      />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useSiteStore } from '~/stores/store';
import { smoothScrollTo } from '~/utils/smooth-scroll-to';
import { typeFilter, imageProps } from '~/utils/groq-common';
import InteractiveHero from '~/components/InteractiveHero.vue';
import ExpandableGallery from '~/components/ExpandableGallery.vue';

const route = useRoute();
const router = useRouter();
const store = useSiteStore();
const pageData = ref(null);
const isPreview = ref(false);

// Computed property for expandable gallery projects
const expandableGalleryProjects = computed(() => {
  if (pageData.value && pageData.value.expandableGallery && pageData.value.expandableGallery.projects) {
    return pageData.value.expandableGallery.projects;
  }
  // Fallback to first 5 projects if no specific gallery projects are set
  return pageData.value?.projects?.slice(0, 5) || [];
});

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
  expandableGallery {
    title,
    projects[]-> {
      title,
      slug,
      "featuredImage": featuredImage.asset->url
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
    border-radius: $radius-xs;
    cursor: pointer;
    
    &:hover {
      background-color: darken($red, 10%);
    }
  }
}

.expandable-gallery-section {
  background-color: $white;
  color: $black;
  .section-title {
    color: $black;
  }
}

</style>
