<template>
  <section class="hero-section pad-bl">
    <div class="hero-section-inner">
      <div class="hero-media">
        <ResponsiveImage  v-if="image" v-bind="image" />
      </div>
      <div class="hero-title pad-b">
        <div class="gutter">
          <h2 v-if="title">{{ title }}</h2>
          <p v-if="subtitle" class="fs-p2">{{ subtitle }}</p>
        </div>
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
  // overflow: hidden;

  .hero-section-inner {
    position: relative;
    // background-color: $black;
    display: flex; 
  }

  .hero-media {
    position: relative;
    width: 50%;
    aspect-ratio: 375/320;
    // max-height: 500px;
    // overflow: hidden;
    // display: flex;

    img,
    video,
    iframe {
      @include abs-fill;
      object-fit: cover;
      object-position: 50% 50%;
    }
  }

  .hero-title {
    // position: absolute;
    // bottom: 0px;
    // left: 0px;
    // width: 100%;
    // color: $white;

    // h2 {
    //   max-width: 500px;
    // }

    p.fs-p2 {
      margin-top: $space-xs;
      line-height: 24px;
    }
  }

  @include respond-to($tablet) {
    .hero-title {
      h2 {
        // width: span(10);
        // max-width: none;
      }

      p.fs-p2 {
        margin-top: $space-m;
        line-height: 34px;
      }
    }
  }

  @include respond-to($average-desktop) {
    .hero-title {
      // h2 {
      //   width: span(8);
      // }
    }
  }
}
</style>