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
import { useSiteStore } from '~/stores/store';
import { imageProps } from '~/utils/groq-common';

const route = useRoute();
const router = useRouter();
const store = useSiteStore();
const params = { slug: route.params.slug };

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
  }
}`;

const [pageData, allProjects] = await Promise.all([
  useSanityData({ query: pageQuery, params: params }),
  useSanityData({ query: allProjectsQuery })
]);

// Debug logging
console.log('allProjects raw data:', allProjects);
console.log('allProjects type:', typeof allProjects);
console.log('allProjects is array:', Array.isArray(allProjects));

// Handle different possible data structures
let projectsArray = [];
if (Array.isArray(allProjects)) {
  projectsArray = allProjects;
} else if (allProjects && typeof allProjects === 'object') {
  // If it's an object, it might be wrapped in a property
  if (allProjects.projects && Array.isArray(allProjects.projects)) {
    projectsArray = allProjects.projects;
  } else if (allProjects.data && Array.isArray(allProjects.data)) {
    projectsArray = allProjects.data;
  } else {
    // If it's a single object, wrap it in an array
    projectsArray = [allProjects];
  }
}

console.log('projectsArray:', projectsArray);

// Find the next project (loop back to first if at the end)
const currentIndex = projectsArray.findIndex(project => project.slug?.current === route.params.slug);
const nextProject = projectsArray.length > 0 
  ? projectsArray[(currentIndex + 1) % projectsArray.length] 
  : null;

// Validate nextProject has required properties
const validNextProject = nextProject && nextProject.slug && nextProject.slug.current && nextProject.title 
  ? nextProject 
  : null;

console.log('nextProject:', nextProject);
console.log('validNextProject:', validNextProject);
</script>

<style lang='scss'>
.case-study-page {
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
