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
              textColor="black"
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
              :textColor="'black'"
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
      <section v-if="allSkills.length" class="skills-section">
        <div class="skills-container">
          <h2 v-if="pageData.skillsSection?.title" class="section-title">
            {{ pageData.skillsSection.title }}
          </h2>
          <FallingText
            :text="skillsText"
            :highlightWords="highlightedSkills"
            highlightClass="skill-highlight"
            trigger="scroll"
            backgroundColor="transparent"
            :wireframes="false"
            :gravity="0.56"
            fontSize="1.2rem"
            :mouseConstraintStiffness="0.9"
            className="skills-falling-text"
          />
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
              <AnimatedButton
                v-if="pageData.ctaSection.buttonText && pageData.ctaSection.buttonLink"
                :to="pageData.ctaSection.buttonLink"
                :text="pageData.ctaSection.buttonText"
                variant="primary"
              />
              <AnimatedButton
                v-if="pageData.ctaSection.secondaryLinkText && pageData.ctaSection.secondaryLink"
                :to="pageData.ctaSection.secondaryLink"
                :text="pageData.ctaSection.secondaryLinkText"
                variant="secondary"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { imageProps } from '~/utils/groq-common';

const pageData = ref(null);

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

// Create skills text for FallingText
const skillsText = computed(() => {
  return allSkills.value.join(' ');
});

// Define which skills to highlight (you can customize this)
const highlightedSkills = computed(() => {
  // Highlight a few key skills - customize as needed
  return ['react', 'vue', 'typescript', 'node', 'graphql', 'javascript', 'python'];
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
    min-height: 50vh;
    background: $black;
    position: relative;
    padding: 4rem 0;

    .skills-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .section-title {
      color: $white;
      text-align: center;
      margin-bottom: 3rem;
    }

    .skills-falling-text {
      width: 100%;
      
      :deep(.falling-text-target) {
        font-family: $poppins;
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

  }
}
</style>
