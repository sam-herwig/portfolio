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
          :title="block.title"
          :text="block.text"
          :linkUrl="block.linkUrl"
          :linkText="block.linkText"
          :fadeInDelay="block.fadeInDelay"
        />
        <!-- Hero Text component -->
        <BuilderHeroText
          v-if="block.type === 'heroText'"
          :title="block.title"
          :subtitle="block.subtitle"
          :circularText="block.circularText"
          :centerText="block.centerText"
          :centerImage="block.centerImage"
          :linkUrl="block.linkUrl"
          :linkText="block.linkText"
          :backgroundColor="block.backgroundColor"
          :textColor="block.textColor"
          :rotationSpeed="block.rotationSpeed"
          :direction="block.direction"
          :fontSize="block.fontSize"
        />
        <!-- Masonry Wall component -->
        <BuilderMasonryWall
          v-if="block.type === 'masonryWall'"
          :items="block.items"
          :columnWidth="block.columnWidth"
          :gapSize="block.gapSize"
        />
        <!-- Circular Text component -->
        <BuilderCircularText
          v-if="block.type === 'circularText'"
          :circularText="block.circularText"
          :centerImage="block.centerImage"
          :centerText="block.centerText"
          :rotationSpeed="block.rotationSpeed"
          :direction="block.direction"
          :fontSize="block.fontSize"
          :textColor="block.textColor"
        />
      </template>
      
      <!-- Up Next Section -->
      <section v-if="nextProjects.length" class="expandable-gallery-section section-pad">
        <h2 class="section-title">Up Next</h2>
        <ExpandableGallery :projects="nextProjects" />
      </section>
      
      <Footer />
    </template> 
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { imageProps } from '~/utils/groq-common';
import BuilderCarousel from '~/components/BuilderCarousel.vue';
import BuilderMasonryWall from '~/components/BuilderMasonryWall.vue';
import BuilderCircularText from '~/components/BuilderCircularText.vue';
import BuilderHeroText from '~/components/BuilderHeroText.vue';
import ExpandableGallery from '~/components/ExpandableGallery.vue';

const route = useRoute();
const params = { slug: route.params.slug };
const pageData = ref(null);

// Query for all projects to get the next one
const allProjectsQuery = groq`*[_type == 'project'] | order(title asc) {
  title,
  slug,
  "featuredImage": featuredImage.asset->url
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
      "type": _type,
      headline,
      richtext
    },
    _type == 'pullQuote' => {
      "type": _type,
      title,
      citee
    },
    _type == 'singleImage' => {
      "type": _type,
      image ${imageProps}
    },
    _type == 'videoLoop' => {
      "type": _type,
      vimeo
    },
    _type == 'videoPlayer' => {
      "type": _type,
      vimeo
    },
    _type == 'heroExplosion' => {
      "type": _type,
      "centerImage": centerImage.asset->{
        "src": url,
        "alt": altText,
        "width": metadata.dimensions.width,
        "height": metadata.dimensions.height
      },
      title,
      text,
      linkUrl,
      linkText,
      fadeInDelay
    },
    _type == 'heroText' => {
      "type": _type,
      title,
      subtitle,
      circularText,
      centerText,
      "centerImage": centerImage.asset->{
        "src": url,
        "alt": altText,
        "width": metadata.dimensions.width,
        "height": metadata.dimensions.height
      },
      linkUrl,
      linkText,
      backgroundColor,
      textColor,
      rotationSpeed,
      direction,
      fontSize
    },
    // Carousel block support
    _type == 'carousel' => {
      "type": _type,
      images[] {
        "src": asset->url,
        "alt": alt
      }
    },
    _type == 'masonryWall' => {
      "type": _type,
      title,
      columnWidth,
      gapSize,
      "items": items[] {
        _type == 'imageItem' => {
          "type": "image",
          "src": image.asset->url,
          "alt": alt,
          "aspectRatio": aspectRatio
        },
        _type == 'videoItem' => {
          "type": "video",
          "src": video.asset->url,
          "poster": poster.asset->url,
          autoplay,
          loop,
          muted,
          "aspectRatio": aspectRatio
        }
      }
    },
    _type == 'circularText' => {
      "type": _type,
      circularText,
      "centerImage": centerImage.asset->{
        "src": url,
        "alt": altText,
        "width": metadata.dimensions.width,
        "height": metadata.dimensions.height
      },
      centerText,
      rotationSpeed,
      direction,
      fontSize,
      textColor
    }
  }
}`;

// Function to fetch data
const fetchData = async () => {
  try {
    const [data, allProjects] = await Promise.all([
      useSanityData({ query: pageQuery, params: params }),
      useSanityData({ query: allProjectsQuery })
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
    
    const currentIndex = projectsArray.findIndex(project => project.slug?.current === route.params.slug);
    const totalProjects = projectsArray.length;
    const nextItems = [];
    const maxItems = Math.min(3, Math.max(0, totalProjects - 1));

    if (totalProjects > 0) {
      for (let offset = 1; offset <= maxItems; offset += 1) {
        const nextProject = projectsArray[(currentIndex + offset) % totalProjects];
        if (nextProject && nextProject.slug?.current && nextProject.title) {
          nextItems.push(nextProject);
        }
      }
    }

    nextProjects.value = nextItems;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Initialize data
const nextProjects = ref([]);
await fetchData();

// Watch for route changes to update data
watch(() => route.params.slug, async () => {
  params.slug = route.params.slug;
  await fetchData();
});
</script>

<style lang='scss'>
.case-study-page {
  .expandable-gallery-section {
    background-color: $white;
    color: $black;
    border-top: 1px solid $ash;

    .section-title {
      color: $black;
    }
  }
}
</style>
