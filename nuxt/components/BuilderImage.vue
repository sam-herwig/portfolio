<template>
  <section class="builder-image pad-bl">
    <div class="gutter">
      <div class="image-size" :style="{'aspectRatio': `${image.width}/${image.height}`}">
        <ResponsiveImage v-bind="image" />
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  image: {
    type: Object
  }
});
</script>

<style lang='scss'>
.builder-image {
  .image-size {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background-color: $black;
    overflow: hidden;
  }

  @include respond-to($large-tablet) {
    .gutter {
      margin: 0 span(1);
    }
  }

  @include respond-to($desktop) {
    .gutter {
      margin: 0 span(2);
    }
  }

  @include respond-to($retina-macbook) {
    .gutter {
      margin: 0 span(2.5);
    }
  }
}
</style>
