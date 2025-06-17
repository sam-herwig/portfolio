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
      </template>
      <Footer />
    </template> 
  </div>
</template>

<script setup>
import { useSiteStore } from '~/stores/store';

const route = useRoute();
const router = useRouter();
const store = useSiteStore();
const params = { slug: route.params.slug };
const pageQuery = groq`*[(_type == 'caseStudy' || _type == 'project') && slug.current == $slug][0]{
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
  }
}`;
const pageData = await useSanityData({ query: pageQuery, params: params });


</script>

<style lang='scss'>
.case-study-page {
}
</style>
