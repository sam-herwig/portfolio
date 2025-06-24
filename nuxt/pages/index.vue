<template>
  <div id="home-page" class="page space-t">
    <Hero 
      v-if="pageData"
      :title="pageData.heroTitle"
      :subtitle="pageData.heroSubtitle"
      :image="pageData.heroImage"
    />
    
    <Projects
      v-if="pageData && pageData.projects"
      :projects="pageData.projects"
    />

    <!-- Contact Form Section -->
    <section class="container mx-auto px-4 py-12">
      <!-- <h2 class="text-3xl font-bold mb-8 text-center">Get In Touch</h2> -->
      <ContactForm />
    </section>

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
  projects[]-> {
    title,
    subtitle,
    slug,
    titleClass,
    "cursorImage": cursorImage.asset->url,
    tags
  }
}`;

const pageData = await useSanityData({ query: homeQuery });

// Debug logging
console.log('Home page data:', pageData);
console.log('Projects data:', pageData?.projects);
if (pageData?.projects) {
  pageData.projects.forEach((project, index) => {
    console.log(`Project ${index}:`, {
      title: project.title,
      slug: project.slug,
      slugCurrent: project.slug?.current
    });
  });
}
</script>
