<template>
  <div id="projects-page" class="page space-t">
    <BuilderGeneralBlock
      v-if="block"
      :title="block.title"
      :text="block.text"
    />
    <BuilderHeroText
      :title="'projects'"
      :circularText="'Check EM OUT '"
      :backgroundColor="red"
      :textColor="'black'"
      :rotationSpeed="20"
      :direction="1"
      :fontSize="5"
    />

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
    
    <!-- Fallback grid display if no flowing menu is configured -->
    <section class="projects-grid-section" v-else-if="pageData && pageData.projects && pageData.projects.length > 0">
      <div class="gutter">
        <h2 class="section-title">ALL PROJECTS</h2>
        <div class="projects-grid">
          <div 
            v-for="(project, index) in pageData.projects" 
            :key="index" 
            class="project-item"
          >
            <NuxtLink :to="`/${project.slug.current}`" class="project-link">
              <MarqueeItem
                :text="project.title"
                :linkTo="`/${project.slug.current}`"
                :image="project.cursorImage"
                textColor="white"
                class="project-marquee"
              />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
    
    <Footer />
  </div>
</template>

<script setup>
import BuilderGeneralBlock from '~/components/BuilderGeneralBlock.vue';
import Footer from '~/components/Footer.vue';
import FlowingMenu from '~/components/FlowingMenu.vue';
import MarqueeItem from '~/components/MarqueeItem.vue';

const projectsQuery = groq`*[(_type == "projectsPage")][0]{
  blocks[] {
    _type == 'generalBlock' => {
      'type': _type,
      title,
      text
    },
    _type == 'flowingMenu' => {
      'type': _type,
      title,
      backgroundColor,
      textColor,
      enableTags,
      height
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

// Process the data for the flowing menu
const flowingMenuBlock = pageData?.blocks?.find(b => b.type === 'flowingMenu');
if (flowingMenuBlock) {
  // Add the projects to the flowing menu block for easy access in the template
  pageData.flowingMenu = {
    ...flowingMenuBlock,
    projects: pageData?.projects || []
  };
}
</script>

<style lang="scss">
#projects-page {
  min-height: 100vh;
  background: $white;
}

.flowing-menu-section {
  padding: 4rem 0;
  background-color: $dark-black;
  
  .section-title {
    font-family: $poppins-extra-bold;
    font-size: 2.5rem;
    text-align: center;
    color: $white;
    margin-bottom: 2rem;
  }
  
  .flowing-menu-container {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    overflow: hidden;
    position: relative;
  }
}

.projects-grid-section {
  padding: 4rem 0;
  background-color: $dark-black;
  color: $white;
  
  .section-title {
    font-family: $poppins-extra-bold;
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 3rem;
  }
  
  // .projects-grid {
  //   display: grid;
  //   grid-template-columns: repeat(1, 1fr);
  //   gap: 2rem;
    
  //   @media (min-width: 768px) {
  //     grid-template-columns: repeat(2, 1fr);
  //   }
    
  //   @media (min-width: 1200px) {
  //     grid-template-columns: repeat(3, 1fr);
  //   }
  // }
  
  .project-item {
    .project-link {
      text-decoration: none;
      display: block;
    }
    
    .project-marquee {
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      
      @media (max-width: 768px) {
        height: 80px;
      }
    }
  }
}
</style> 