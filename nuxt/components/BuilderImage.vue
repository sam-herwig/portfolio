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
    @include media-frame;
  }

  .gutter {
    @include media-gutter;
  }
}
</style>
