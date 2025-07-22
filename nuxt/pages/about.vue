<template>
  <div class="about-page page">
    <template v-if="pageData">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <TextPressure 
              text="About"
              :width="true"
              :weight="true"
              :italic="false"
              :stroke="false"
              textColor="white"
              :minFontSize="180"
              className="hero-text-pressure"
              parentClassName="hero-title-wrapper"
              encryptedClassName="encrypted-2"
              animateOn="hover"
              :sequential="true"
              revealDirection="start"
              :speed="30"
              :autoAnimate="true"
              :autoAnimateInterval="5000"
            />
          <div class="circular-text-wrapper">
            <BuilderCircularText
              v-if="pageData.heroSection?.circularText"
              :circularText="pageData.heroSection.circularText"
              :centerImage="pageData.heroSection.centerImage"
              :rotationSpeed="10"
              :direction="1"
              :fontSize="5"
              :textColor="'white'"
            />
          </div>
        </div>
      </section>

      <!-- Personal Section -->
      <section 
        v-if="pageData.personalSection?.content" 
        :class="['personal-section', `personal-section--${pageData.personalSection.backgroundColor || 'orange'}`]"
      >
        <div class="gutter">
          <h2 v-if="pageData.personalSection.title" class="section-title">
            {{ pageData.personalSection.title }}
          </h2>
          <div class="personal-content">
            <RichTextContent :content="pageData.personalSection.content" />
          </div>
        </div>
      </section>

      <!-- Skills & Expertise Section -->
      <section v-if="allSkills.length" class="skills-section" ref="skillsSection">
        <div class="skills-container">
          <h2 v-if="pageData.skillsSection?.title" class="section-title">
            {{ pageData.skillsSection.title }}
          </h2>
          <div class="skills-pills">
            <span
              v-for="(skill, index) in allSkills"
              :key="skill"
              class="skill-pill"
              :style="skillPositions[index]"
              :data-index="index"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </section>

      <!-- Experience Timeline -->
      <section v-if="pageData.experienceTimeline?.experiences?.length" class="experience-section">
        <div class="gutter">
          <h2 v-if="pageData.experienceTimeline.title" class="section-title">
            {{ pageData.experienceTimeline.title }}
          </h2>
          <div class="timeline">
            <div class="timeline-line"></div>
            <div
              v-for="(exp, index) in pageData.experienceTimeline.experiences"
              :key="index"
              :class="['timeline-item', index % 2 === 0 ? 'timeline-item--left' : 'timeline-item--right']"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h3 class="timeline-company">{{ exp.companyName }}</h3>
                <h4 class="timeline-role">{{ exp.roleTitle }}</h4>
                <p v-if="exp.dateRange" class="timeline-date">{{ exp.dateRange }}</p>
                <p v-if="exp.description" class="timeline-description">{{ exp.description }}</p>
                <ul v-if="exp.achievements?.length" class="timeline-achievements">
                  <li v-for="achievement in exp.achievements" :key="achievement">
                    {{ achievement }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section v-if="pageData.ctaSection" class="cta-section">
        <div class="gutter">
          <div class="cta-content">
            <h2 v-if="pageData.ctaSection.heading" class="cta-heading">
              {{ pageData.ctaSection.heading }}
            </h2>
            <div class="cta-buttons">
              <NuxtLink
                v-if="pageData.ctaSection.buttonText && pageData.ctaSection.buttonLink"
                :to="pageData.ctaSection.buttonLink"
                class="cta-button cta-button--primary"
              >
                {{ pageData.ctaSection.buttonText }}
              </NuxtLink>
              <NuxtLink
                v-if="pageData.ctaSection.secondaryLinkText && pageData.ctaSection.secondaryLink"
                :to="pageData.ctaSection.secondaryLink"
                class="cta-button cta-button--secondary"
              >
                {{ pageData.ctaSection.secondaryLinkText }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { imageProps } from '~/utils/groq-common';

const pageData = ref(null);
const skillsSection = ref(null);
const skillPositions = ref([]);

const pageQuery = groq`*[_type == 'aboutPage'][0]{
  title,
  heroSection {
    heading,
    subheading,
    circularText,
    "centerImage": centerImage.asset->{
      "src": url,
      "alt": altText,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height
    }
  },
  skillsSection {
    title,
    skills
  },
  experienceTimeline {
    title,
    experiences[] {
      companyName,
      roleTitle,
      dateRange,
      description,
      achievements
    }
  },
  personalSection {
    title,
    content,
    backgroundColor
  },
  ctaSection {
    heading,
    buttonText,
    buttonLink,
    secondaryLinkText,
    secondaryLink
  }
}`;

// Fetch data
const data = await useSanityData({ query: pageQuery });
pageData.value = data;

// Get all skills
const allSkills = computed(() => {
  if (!pageData.value?.skillsSection?.skills) return [];
  return pageData.value.skillsSection.skills;
});

// Function to check if two elements overlap
const checkOverlap = (pos1, pos2, width1, height1, width2, height2) => {
  return !(pos1.left + width1 < pos2.left || 
           pos2.left + width2 < pos1.left || 
           pos1.top + height1 < pos2.top || 
           pos2.top + height2 < pos1.top);
};

// Function to generate random positions
const generatePositions = async () => {
  if (!skillsSection.value || !allSkills.value.length) return;
  
  await nextTick();
  
  const container = skillsSection.value;
  const containerRect = container.getBoundingClientRect();
  const pills = container.querySelectorAll('.skill-pill');
  const positions = [];
  const placedPositions = [];
  
  pills.forEach((pill, index) => {
    const pillRect = pill.getBoundingClientRect();
    const pillWidth = pillRect.width;
    const pillHeight = pillRect.height;
    
    let position;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      // Random position within container bounds
      const maxLeft = containerRect.width - pillWidth - 40;
      const maxTop = containerRect.height - pillHeight - 100; // Leave space for title
      
      position = {
        left: Math.random() * maxLeft + 20,
        top: Math.random() * maxTop + 80 // Start below title
      };
      
      // Check for overlaps
      const hasOverlap = placedPositions.some(placed => 
        checkOverlap(position, placed.position, pillWidth, pillHeight, placed.width, placed.height)
      );
      
      if (!hasOverlap || attempts >= maxAttempts) {
        placedPositions.push({ position, width: pillWidth, height: pillHeight });
        break;
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    // Random starting position (off-screen)
    const angle = Math.random() * Math.PI * 2;
    const distance = 1000;
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;
    
    positions[index] = {
      '--start-x': `${startX}px`,
      '--start-y': `${startY}px`,
      '--end-x': `${position.left}px`,
      '--end-y': `${position.top}px`,
      '--delay': `${index * 0.05}s`
    };
  });
  
  skillPositions.value = positions;
};

onMounted(() => {
  generatePositions();
  
  // Re-generate positions on window resize
  window.addEventListener('resize', generatePositions);
});
</script>

<style lang='scss'>
.about-page {
  .hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $black;
    position: relative;
    overflow: hidden;
    background-color: $red;

    // &::before {
    //   content: '';
    //   position: absolute;
    //   top: 0;
    //   left: 0;
    //   right: 0;
    //   bottom: 0;
    //   background: radial-gradient(circle at center, transparent 0%, rgba($black, 0.2) 100%);
    //   pointer-events: none;
    // }

    .hero-content {
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .hero-heading {
      font-family: $poppins-extra-bold;
      font-size: 4rem;
      color: $white;
      margin-bottom: 1rem;

      @media #{$tablet} {
        font-size: 2.5rem;
      }
    }

    .hero-subheading {
      font-family: $poppins-semi-bold;
      font-size: 1.5rem;
      color: $white;
      opacity: 0.8;
      margin-bottom: 3rem;
    }

    .circular-text-wrapper {
      width: 400px;
      height: 400px;
      margin: 0 auto;

      @media #{$tablet} {
        width: 300px;
        height: 300px;
      }

      @media #{$mobile} {
        width: 250px;
        height: 250px;
      }
    }
  }


  .section-title {
    font-family: $poppins-semi-bold;
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 3rem;

    @media #{$tablet} {
      font-size: 1.75rem;
      margin-bottom: 2rem;
    }
  }

  .skills-section {
    height: 50vh;
    background: $black;
    position: relative;
    overflow: hidden;

    .skills-container {
      position: relative;
      height: 100%;
      width: 100%;
    }

    .section-title {
      position: absolute;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%);
      color: $white;
      z-index: 10;
      margin: 0;
    }

    .skills-pills {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .skill-pill {
      position: absolute;
      display: inline-block;
      padding: 0.75rem 1.75rem;
      font-family: $poppins;
      font-size: 1rem;
      color: $black;
      background: $white;
      border-radius: 50px;
      white-space: nowrap;
      animation: slideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      animation-delay: var(--delay);
      transform: translate(var(--start-x), var(--start-y));
      opacity: 0;
      transition: all $speed-333 $ease-out;

      &:hover {
        transform: translate(var(--end-x), var(--end-y)) scale(1.1);
        box-shadow: 0 8px 24px rgba($white, 0.3);
        background: $red;
        color: $white;
      }

      @keyframes slideIn {
        0% {
          opacity: 0;
          transform: translate(var(--start-x), var(--start-y));
        }
        20% {
          opacity: 1;
        }
        100% {
          opacity: 1;
          transform: translate(var(--end-x), var(--end-y));
        }
      }
    }
  }

  .experience-section {
    padding: 4rem 0;
    background: $white;

    .timeline {
      position: relative;
      max-width: 1200px;
      margin: 0 auto;
    }

    .timeline-line {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 2px;
      background: $ash;
      transform: translateX(-50%);

      @media #{$tablet} {
        left: 20px;
      }
    }

    .timeline-item {
      position: relative;
      width: 45%;
      margin-bottom: 3rem;

      @media #{$tablet} {
        width: calc(100% - 60px);
        margin-left: 40px;
      }

      &--left {
        left: 0;
        text-align: right;

        @media #{$tablet} {
          text-align: left;
        }

        .timeline-dot {
          right: -9px;

          @media #{$tablet} {
            left: -29px;
            right: auto;
          }
        }
      }

      &--right {
        left: 55%;

        @media #{$tablet} {
          left: 0;
          margin-left: 40px;
        }

        .timeline-dot {
          left: -9px;

          @media #{$tablet} {
            left: -29px;
          }
        }
      }
    }

    .timeline-dot {
      position: absolute;
      top: 0;
      width: 16px;
      height: 16px;
      background: $red;
      border-radius: 50%;
      border: 3px solid $white;
    }

    .timeline-content {
      background: $ash;
      padding: 2rem;
      border-radius: 8px;
    }

    .timeline-company {
      font-family: $poppins-semi-bold;
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .timeline-role {
      font-family: $poppins;
      font-size: 1rem;
      color: rgba($black, 0.8);
      margin-bottom: 0.5rem;
    }

    .timeline-date {
      font-size: 0.875rem;
      color: rgba($black, 0.6);
      margin-bottom: 1rem;
    }

    .timeline-description {
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    .timeline-achievements {
      list-style: none;
      padding: 0;

      li {
        position: relative;
        padding-left: 1.5rem;
        margin-bottom: 0.5rem;

        &::before {
          content: '•';
          position: absolute;
          left: 0;
          color: $red;
          font-weight: bold;
        }
      }
    }
  }

  .personal-section {
    padding: 4rem 0;
    color: $white;
    position: relative;
    overflow: hidden;

    &--orange {
      background: $orange;
    }

    &--green {
      background: $green;
    }

    &--purple {
      background: $purple;
    }

    &--dark {
      background: $black;
    }

    .personal-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      text-align: center;

      p {
        font-size: 1.125rem;
        line-height: 1.8;
        margin-bottom: 1.5rem;
      }

      h3 {
        font-family: $omelet-hand;
        font-size: 2rem;
        margin: 2rem 0 1rem;
      }
    }
  }

  .cta-section {
    padding: 4rem 0;
    background: $black;
    text-align: center;

    .cta-heading {
      font-family: $poppins-semi-bold;
      font-size: 2.5rem;
      color: $white;
      margin-bottom: 2rem;

      @media #{$tablet} {
        font-size: 2rem;
      }
    }

    .cta-buttons {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .cta-button {
      display: inline-block;
      padding: 1.25rem 3rem;
      font-family: $poppins-semi-bold;
      font-size: 1.125rem;
      text-decoration: none;
      border-radius: 50px;
      transition: all $speed-333 $ease-out;
      text-transform: none;
      letter-spacing: 0.5px;
      background: transparent;
      color: $white;
      border: 3px solid $white;

      &:hover {
        background: $white;
        color: $black;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba($black, 0.3);
      }

      &--primary {
        // Both buttons now have the same style
      }

      &--secondary {
        // Both buttons now have the same style
      }
    }
  }
}
</style>