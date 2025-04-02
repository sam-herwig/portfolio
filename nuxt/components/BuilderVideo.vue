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
