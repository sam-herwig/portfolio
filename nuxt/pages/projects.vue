<template>
  <div id="projects-page" class="page space-t">
    <BuilderGeneralBlock
      v-if="block"
      :title="block.title"
      :text="block.text"
    />
    <section class="projects-section">
      <div class="projects-header-title">
        <h2 class="projects-title">PROJECTS</h2>
      </div>
      <div class="projects-divider"></div>
      <div class="projects-grid">
        <div 
          v-for="(project, index) in projects" 
          :key="index" 
          class="project-item"
        >
          <NuxtLink :to="`/${project.slug.current}`" class="project-link">
            <div class="project-title" :class="project.titleClass">{{ project.title }}</div>
            <div class="project-subtitle">{{ project.subtitle }}</div>
          </NuxtLink>
        </div>
      </div>
    </section>
    <Footer />
  </div>
</template>

<script setup>
import BuilderGeneralBlock from '~/components/BuilderGeneralBlock.vue';
import Footer from '~/components/Footer.vue';

const projectsQuery = groq`*[(_type == "projectsPage")][0]{
  blocks[] {
    _type == 'generalBlock' => {
      'type': _type,
      title,
      text
    }
  },
  projects[]-> {
    title,
    subtitle,
    slug,
    titleClass,
    "cursorImage": cursorImage.asset->url,
    tags
  }
}`;

const pageData = await useSanityData({ query: projectsQuery });
const block = pageData?.blocks?.find(b => b.type === 'generalBlock');
const projects = pageData?.projects || [];
</script>

<style lang="scss">
#projects-page {
  min-height: 100vh;
  background: $white;
}
.projects-section {
  padding: 4rem 0;
  background-color: $dark-black;
  color: $white;
  .projects-header-title {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 4rem;
    margin-bottom: 2rem;
    .projects-title {
      font-family: $poppins-extra-bold;
      font-size: 3rem;
      margin: 0;
    }
  }
  .projects-divider {
    height: 1px;
    background-color: $red;
    margin: 2rem 0;
  }
  .projects-grid {
    padding: 2rem 4rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4rem;
    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 767px) {
      grid-template-columns: 1fr;
      padding: 2rem;
    }
    .project-item {
      position: relative;
      .project-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      .project-title {
        font-family: $poppins-extra-bold;
        font-size: 2.5rem;
        line-height: 1;
        margin-bottom: 0.5rem;
        &.red {
          color: $red;
        }
      }
      .project-subtitle {
        font-family: $poppins-semi-bold;
        font-size: 1rem;
        opacity: 0.8;
      }
    }
  }
}
</style> 