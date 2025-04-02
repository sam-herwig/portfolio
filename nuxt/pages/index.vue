<template>
  <div id="home-page" class="page space-t">
    <Hero 
      v-if="pageData"
      :title="pageData.heroTitle"
      :subtitle="pageData.heroSubtitle"
      :image="pageData.heroImage"
    />

    <News 
      v-if="pageData"
      :caseStudies="pageData.caseStudies"
    />
    <Footer />
  </div>
</template>

<script setup>
import { useSiteStore } from '~/stores/store';
import { smoothScrollTo } from '~/utils/smooth-scroll-to';
import { typeFilter, imageProps } from '~/utils/groq-common';

const route = useRoute();
const router = useRouter();
const store = useSiteStore();

const homeQuery = groq`*[(_type == "home")][0]{
  heroImage ${imageProps},
  heroTitle,
  heroSubtitle, 
  caseStudies[]-> {
    title,
    slug
  },
}`;

const pageData = await useSanityData({ query: homeQuery });

console.log(pageData);

</script>
