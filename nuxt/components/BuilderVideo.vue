<template>
  <section class="builder-video pad-bl">
    <div class="gutter">
      <div class="video-size" :style="{'aspectRatio': (vimeo.play.source.height / vimeo.play.source.width) < 1 ? `${vimeo.play.source.width}/${vimeo.play.source.height}` : '16/9'}">
        <VideoCover :vimeo="vimeo" :controls="controls" />
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  vimeo: {
    type: Object
  },
  controls: {
    type: Boolean
  }
});
</script>

<style lang='scss'>
.builder-video {
  .video-size {
    @include media-frame;
  }

  .gutter {
    @include media-gutter;
  }
}
</style>
