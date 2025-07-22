<template>
  <section class="hero-section">
    <div class="hero-section-inner">
      <div class="hero-left">
        <h1 class="first-name">SAM</h1>
      </div>
      <div class="hero-center">
        <div class="image-collage">
          <div class="collage-image image1">
            <img src="/public/static/calm.png" alt="Collage Image 1" />
          </div>
          <div class="collage-image image2">
            <img src="/public/static/calm.png" alt="Collage Image 2" />
          </div>
          <div class="collage-image image3">
            <!-- <ResponsiveImage v-if="image" v-bind="image" /> -->
            <img src="/public/static/calm.png" alt="Collage Image 3" />
          </div>
        </div>
      </div>
      <div class="hero-right">
        <div class="hero-title">
          <h3 class="job-title">Front End Web Developer<br />& Creative Technologist</h3>
          <div class="hero-links">
            <NuxtLink to="/contact" class="hero-link">CONTACT ME</NuxtLink>
          </div>
        </div>
      </div>
      <div class="hero-bottom">
        <h1 class="last-name">HERWIG</h1>
        <div class="logo-circle">S1</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useSiteStore } from '~/stores/store';

// const route = useRoute(); 
const store = useSiteStore();
const props = defineProps({
  title: {
    type: String
  },
  slug: {
    type: String
  },
  subtitle: {
    type: String
  },
  image: {
    type: Object
  }
});

</script>

<style lang='scss'>
section.hero-section {
  position: relative;
  height: 100svh;
  background-color: $red; /* Red background color */
  color: $black;
  overflow: hidden;

  .hero-section-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: $space-l;
  }

  /* Mobile styles - stacked layout */
  @media (max-width: 767px) {
    height: auto;
    // min-height: 100svh;

    .hero-section-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: $space-l;
      height: auto;
    }

    .hero-left {
      position: relative;
      // top: auto;
      // left: auto;
      // margin-top: $space-l;
      // margin-bottom: $space-l;
      text-align: left;

      .first-name {
        font-size: 80px;
        line-height: 80px;
      }
    }

    .hero-center {
      position: relative;
      top: auto;
      left: auto;
      transform: none;
      width: 100%;
      margin: $space-l 0;

      .image-collage {
        height: 300px;
        margin: 0 auto;
        position: relative;

        .collage-image {
          position: absolute;
          background-color: $black;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .image1, .image2, .image3 {
          width: 70%;
          height: 170px;
          position: absolute;
        }

        .image1 {
          left: 0;
          top: 0;
          z-index: 1;
        }

        .image2 {
          left: 15%;
          top: 60px;
          z-index: 2;
        }

        .image3 {
          left: 30%;
          top: 100px;
          z-index: 3;
        }
      }
    }

    .hero-right {
      position: relative;
      top: auto;
      right: auto;
      max-width: 100%;
      margin: $space-l 0;
      text-align: right;

      .hero-title {
        .job-title {
          font-size: 20px;
          margin-bottom: $space-m;
        }
      }

      .hero-links {
        flex-direction: row;
        justify-content: center;
        gap: $space-m;

        .hero-link {
          display: block;
          font-family: $poppins-semi-bold;
          font-size: 16px;
          padding: $space-xs 0;
          border-bottom: 1px solid $black;
          position: relative;
          padding: $space-xs $space-s;
          text-align: left;
          
          &:after {
            content: "→";
            position: absolute;
            right: 0;
            width: max-content;
          }
        }
      }
    }

    .hero-bottom {
      position: relative;
      bottom: auto;
      right: auto;
      margin-top: auto;
      margin-bottom: $space-l;
      width: 100%;
      justify-content: center;
      display: flex;
      align-items: center;
      text-align: right;

      .last-name {
        font-size: 80px;
        line-height: 80px;
      }

      .logo-circle {
        width: 40px;
        height: 40px;
        font-size: 14px;
      }
    }
  }

  

  @include respond-to($tablet) {
  .hero-left {
    position: absolute;
    top: 100px;
    left: $space-l;
    z-index: 2;
    top: 30px;

    .first-name {
      font-family: $poppins-extra-bold;
      font-size: 180px;
      line-height: 0.9;
      text-transform: uppercase;
    }
  }

  .hero-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    z-index: 1;

    .image-collage {
      position: relative;
      width: 100%;
      height: 300px;

      .collage-image {
        position: absolute;
        background-color: $black;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .image1 {
        width: 40%;
        height: 60%;
        left: 0;
        top: 0;
      }

      .image2 {
        width: 40%;
        height: 60%;
        left: 20%;
        top: 40%;
      }

      .image3 {
        width: 40%;
        height: 60%;
        left: 50%;
        top: 10%;
      }
    }
  }

  .hero-right {
    position: absolute;
    top: 42px;
    right: $space-l;
    z-index: 2;
    max-width: 400px;

    .hero-title {
      .job-title {
        font-family: $poppins-semi-bold;
        font-size: 24px;
        line-height: 1.2;
        margin-bottom: $space-l;
        text-transform: none;
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
        
        &:after {
          content: "→";
          position: absolute;
          right: 0;
        }
      }
    }
  }

  .hero-bottom {
    position: absolute;
    bottom: 90px;
    right: $space-l;
    display: flex;
    align-items: flex-end;
    gap: $space-m;

    .last-name {
      font-family: $poppins-extra-bold;
      font-size: 120px;
      line-height: 0.8;
      text-transform: uppercase;
    }

    .logo-circle {
      width: 50px;
      height: 50px;
      border: 1px solid $black;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: $poppins-semi-bold;
      font-size: 16px;
      margin-bottom: 10px;
    }
  }

    .hero-left {
      .first-name {
        font-size: 220px;
      }
    }

    .hero-right {
      max-width: 350px;

      .hero-title {
        .job-title {
          font-size: 28px;
        }
      }
    }

    .hero-bottom {
      .last-name {
        font-size: 150px;
      }
    }
  }

  @include respond-to($average-desktop) {
    .hero-left {
      .first-name {
        font-size: 280px;
      }
    }

    .hero-center {
      width: 50%;

      .image-collage {
        height: 400px;
      }
    }

    .hero-right {
      max-width: 400px;

      .hero-title {
        .job-title {
          font-size: 32px;
        }
      }
    }

    .hero-bottom {
      .last-name {
        font-size: 180px;
      }

      .logo-circle {
        width: 60px;
        height: 60px;
        font-size: 18px;
      }
    }
  }
}
</style>
