<template>
  <section class="interactive-hero">
    <div class="hero-content">
      <div class="job-title">
        <h3>Front End Web Developer<br />& Creative Technologist</h3>
        <div class="hero-links">
          <NuxtLink to="/contact" class="hero-link">CONTACT ME</NuxtLink>
        </div>
      </div>

      <div class="circular-text-container">
        <BuilderCircularText
          circularText="WELCOME TO THE JUNGLE "
          :rotationSpeed="20"
          :direction="1"
          :fontSize="5"
          textColor="#000000"
        />
      </div>

      <div class="bottom-content">
        <div class="names-stack">
          <div class="first-name-container">
            <TextPressure 
              text="SAM"
              :width="true"
              :weight="true"
              :italic="false"
              :stroke="false"
              textColor="#000000"
              :minFontSize="80"
              className="first-name"
              parentClassName="first-name-wrapper"
              encryptedClassName="encrypted"
              animateOn="hover"
              :sequential="true"
              revealDirection="end"
              :speed="30"
              :autoAnimate="true"
              :autoAnimateInterval="4000"
            />
          </div>
          
          <div class="last-name-container">
            <TextPressure 
              text="HERWIG"
              :width="true"
              :weight="true"
              :italic="false"
              :stroke="false"
              textColor="#000000"
              :minFontSize="80"
              className="last-name"
              parentClassName="last-name-wrapper"
              encryptedClassName="encrypted"
              animateOn="hover"
              :sequential="true"
              revealDirection="start"
              :speed="30"
              :autoAnimate="true"
              :autoAnimateInterval="5000"
            />
          </div>
        </div>
        
        <!-- <div class="logo-circle">S1</div> -->
      </div>
    </div>
  </section>
</template>

<script setup>
import TextPressure from './TextPressure.vue';
import BuilderCircularText from './BuilderCircularText.vue';
</script>

<style lang="scss" scoped>
.interactive-hero {
  position: relative;
  width: 100%;
  height: 100svh;
  background-color: $red;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .hero-content {
    position: relative;
    width: 100%;
    height: 100%;
    padding: $space-l;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .circular-text-container {
    position: absolute;
    top: 50%;
    left:50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    z-index: 1;
    display: flex; 
    align-items: center;
    justify-content: center;

    .builder-circular-text.pad-bl {
      padding: 0;
    }

    @media (min-width: 768px) {
      width: 400px;
      height: 400px;
     
    }
  }

  .bottom-content {
    position: absolute;
    bottom: $space-l;
    left: $space-l;
    display: flex;
    align-items: flex-end;
    gap: $space-m;
  }

  .names-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .first-name-container {
    position: relative;
    // height: 120px;
    margin-bottom: 12px;
    width: auto;
    z-index: 2;
    display: flex;
    align-items: center;
    
    @media (min-width: 768px) {
      height: 140px;
    }
    
    .first-name-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
    }
  }

  .last-name-container {
    position: relative;
    // height: 120px;
    width: auto;
    z-index: 2;
    margin-bottom: 12px;
    margin-top: -20px; /* Overlap the names slightly */
    display: flex;
    align-items: center;
    
    @media (min-width: 768px) {
      // height: 140px;
      // margin-top: -30px;
    }
    
    .last-name-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
    }
  }

  .job-title {
    position: absolute;
    top: $space-xl;
    right: $space-xl;
    max-width: 400px;
    text-align: right;
    z-index: 2;

    h3 {
      font-family: $poppins-semi-bold;
      font-size: 24px;
      line-height: 1.2;
      margin-bottom: $space-l;
      text-transform: none;

      @media (min-width: 768px) {
        font-size: 28px;
      }

      @media (min-width: 1200px) {
        font-size: 32px;
      }
    }

    .hero-links {
      display: flex;
      flex-direction: column;
      gap: $space-s;

      .hero-link {
        display: block;
        font-family: $poppins-semi-bold;
        font-size: 16px;
        padding: $space-xs 0;
        border-bottom: 1px solid $black;
        position: relative;
         font-size: 14px;
           text-align: left;
           display: flex; 
        
        &:after {
          content: "→";
          position: absolute;
          right: 0;
        }
      }
    }
  }

  /* Mobile styles */
  @media (max-width: 767px) {
    .hero-content {
      padding: $space-m;
    }

    .circular-text-container {
      width: 200px;
      height: 200px;
    }

    .bottom-content {
      bottom: $space-m;
      left: $space-m;
      flex-direction: column;
      align-items: flex-start;
      gap: $space-xs;
      width: calc(100% - #{$space-m * 2}); /* Full width minus padding */
    }

    .first-name-container,
    .last-name-container {
      height: 70px;
      width: 100%; /* Full width on mobile */
      margin-bottom: 12px;
    }

    .last-name-container {
      margin-top: -10px; /* Smaller overlap on mobile */
    }
    
    .names-stack {
      width: 100%; /* Full width on mobile */
    }

    .job-title {
      top: $space-l;
      right: $space-l;
      max-width: 80%;

      h3 {
        font-size: 20px;
        margin-bottom: $space-m;
      }
    }
    
  }
}
</style> 