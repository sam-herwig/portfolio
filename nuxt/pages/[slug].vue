<template>
  <div class="case-study-page page">
    <template v-if="pageData">
       <!-- <Hero
        :title="pageData.title"
        :slug="pageData.slug.current"
        :subtitle="pageData.subtitle"
        :media="pageData.heroMedia[0]"
      />
      <BuilderTextBlock
        :headline="pageData.overview.headline"
        :richtext="pageData.overview.richtext"
        :tags="pageData.tags"
      /> -->
      <template v-for="(block, index) in pageData.blocks">
        <BuilderTextBlock
          v-if="block.type === 'textBlock'"
          :headline="block.headline"
          :richtext="block.richtext"
        />
        <BuilderPullQuote
          v-if="block.type === 'pullQuote'"
          :quote="block.title"
          :citee="block.citee"
        />
        <BuilderImage
          v-if="block.type === 'singleImage'"
          :image="block.image"
        />
        <BuilderVideo
          v-if="block.type === 'videoLoop'"
          :vimeo="block.vimeo"
          :controls="false"
        />
        <BuilderVideo
          v-if="block.type === 'videoPlayer'"
          :vimeo="block.vimeo"
          :controls="true"
        />
        <!-- Carousel block support -->
        <BuilderCarousel
          v-if="block.type === 'carousel'"
          :images="block.images"
        />
        <!-- <BuilderImageExplosion
          v-if="block.type === 'imageExplosion'"
          :centerImage="block.centerImage"
          :explosionImages="block.explosionImages"
          :explosionVideos="block.explosionVideos"
          :animationDuration="block.animationDuration"
          :staggerDelay="block.staggerDelay"
          :fadeOutDelay="block.fadeOutDelay"
          :gradientText="block.showGradientText && block.gradientText ? block.gradientText : null"
        /> -->
        <BuilderHeroExplosion
          v-if="block.type === 'heroExplosion'"
          :centerImage="block.centerImage"
          :explosionImages="block.explosionImages"
          :explosionVideos="block.explosionVideos"
          :animationDuration="block.animationDuration"
          :staggerDelay="block.staggerDelay"
        />
      </template>
      
      <!-- Preview Mode Banner -->
      <div v-if="isPreview" class="preview-banner">
        <p>Preview Mode Active</p>
        <button @click="exitPreview">Exit Preview</button>
      </div>
      
      <!-- Up Next Section -->
      <section v-if="validNextProject" class="up-next-section">
        <div class="gutter">
          <h2 class="up-next-title">Up Next</h2>
          <NuxtLink :to="`/${validNextProject.slug.current}`" class="up-next-link">
            <h3 class="next-project-title">{{ validNextProject.title }}</h3>
          </NuxtLink>
        </div>
      </section>
      
      <Footer />
    </template> 
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useSiteStore } from '~/stores/store';
import { imageProps } from '~/utils/groq-common';
import BuilderCarousel from '~/components/BuilderCarousel.vue';

const route = useRoute();
const router = useRouter();
const store = useSiteStore();
const params = { slug: route.params.slug };
const isPreview = ref(false);
const pageData = ref(null);

// Query for all projects to get the next one
const allProjectsQuery = groq`*[_type == 'project'] | order(title asc) {
  title,
  slug
}`;

const pageQuery = groq`*[( _type == 'project') && slug.current == $slug][0]{
  _type,
  title,
  slug,
  subtitle,
  overview {
    headline,
    richtext
  },
  tags[]-> {
    tag
  },
  blocks[] {
    _type == 'textBlock' => {
      'type': _type,
      headline,
      richtext
    },
    _type == 'pullQuote' => {
      'type': _type,
      title,
      citee
    },
    _type == 'singleImage' => {
      'type': _type,
      image ${imageProps}
    },
    _type == 'videoLoop' => {
      'type': _type,
      vimeo
    },
    _type == 'videoPlayer' => {
      'type': _type,
      vimeo
    },
    _type == 'heroExplosion' => {
      'type': _type,
      'centerImage': {
        'src': centerImage.asset->url,
        'alt': centerImage.asset->altText,
        'width': centerImage.asset->metadata.dimensions.width,
        'height': centerImage.asset->metadata.dimensions.height
      },
      'explosionImages': explosionImages[].asset->{
        'src': url,
        'alt': altText,
        'width': metadata.dimensions.width,
        'height': metadata.dimensions.height
      },
      'explosionVideos': explosionVideos[].asset->{
        'src': url,
        'width': metadata.dimensions.width,
        'height': metadata.dimensions.height
      },
      animationDuration,
      staggerDelay
    },
    // Carousel block support
    _type == 'carousel' => {
      'type': _type,
      images[] {
        'src': asset->url,
        'alt': alt
      }
    },
  }
}`;

// Function to fetch data
const fetchData = async () => {
  isPreview.value = route.query.preview === 'true';
  
  try {
    const [data, allProjects] = await Promise.all([
      useSanityData({ query: pageQuery, params: params, preview: isPreview.value }),
      useSanityData({ query: allProjectsQuery, preview: isPreview.value })
    ]);
    
    pageData.value = data;
    
    // Handle different possible data structures for allProjects
    let projectsArray = [];
    if (Array.isArray(allProjects)) {
      projectsArray = allProjects;
    } else if (allProjects && typeof allProjects === 'object') {
      if (allProjects.projects && Array.isArray(allProjects.projects)) {
        projectsArray = allProjects.projects;
      } else if (allProjects.data && Array.isArray(allProjects.data)) {
        projectsArray = allProjects.data;
      } else {
        projectsArray = [allProjects];
      }
    }
    
    // Find the next project (loop back to first if at the end)
    const currentIndex = projectsArray.findIndex(project => project.slug?.current === route.params.slug);
    const nextProject = projectsArray.length > 0 
      ? projectsArray[(currentIndex + 1) % projectsArray.length] 
      : null;
    
    // Validate nextProject has required properties
    validNextProject.value = nextProject && nextProject.slug && nextProject.slug.current && nextProject.title 
      ? nextProject 
      : null;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Initialize data
const validNextProject = ref(null);
await fetchData();

// Set up live preview updates
onMounted(() => {
  if (isPreview.value && process.client) {
    // Set up listener for content changes if in preview mode
    const { $sanity } = useNuxtApp();
    if ($sanity && $sanity.client) {
      const subscription = $sanity.client
        .listen(pageQuery, params)
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

// Watch for route changes to update data
watch(() => route.params.slug, async () => {
  params.slug = route.params.slug;
  await fetchData();
});

// Exit preview mode
const exitPreview = () => {
  const currentPath = route.path;
  router.replace(currentPath);
};
</script>

<style lang='scss'>
.case-study-page {
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

  .up-next-section {
    padding: 4rem 0;
    background-color: $dark-black;
    color: $white;
    border-top: 1px solid $red;
    
    .up-next-title {
      font-family: $poppins-extra-bold;
      font-size: 2rem;
      margin-bottom: 2rem;
      text-align: center;
    }
    
    .up-next-link {
      text-decoration: none;
      color: inherit;
      display: block;
      text-align: center;
      
      &:hover {
        .next-project-title {
          color: $red;
        }
      }
    }
    
    .next-project-title {
      font-family: $poppins-extra-bold;
      font-size: 3rem;
      line-height: 1;
      transition: color 0.3s ease;
      
      @media (max-width: 768px) {
        font-size: 2rem;
      }
    }
  }
}
</style>
