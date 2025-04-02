<template>
  <div
    class="responsive-image-wrapper"
    :class="{
      '--fill': fit !== 'contain',
      'responsive-image-picture--is-loaded': isLoaded,
      'responsive-image-picture--is-errored': isErrored,
      'responsive-image-picture--is-fully-visible': isFullyVisible
    }"
  >
    <p v-if="!nosr" class="screen-reader">Image element: {{ dataAlt ? dataAlt : dataFilename }}</p>
    <picture class="responsive-image-picture picture" :class="{ 'responsive-image-fade': !palette }">
      <source :srcset="src.endsWith('.png') ? generateSrcSet('png') : generateSrcSet('jpg')" :type="src.endsWith('.png') ? 'image/png' : 'image/jpeg'" :sizes="`${effectiveWidth}px`">
      <img
        :src="generateSrc()"
        :alt="dataAlt ? dataAlt : dataFilename"
        :loading="isLazy ? 'lazy' : 'eager'"
        :sizes="`${effectiveWidth}px`"
        ref="image"
      >
    </picture>
    <div v-if="palette" class="responsive-image-palette" :style="{ 'background-color': `${palette.vibrant.background}` }" />
  </div>
</template>

<script>
import { default as throttle } from 'lodash/throttle.js';

export default {
  props: {
    nosr: {
      type: Boolean,
      required: false,
      default: false
    },
    src: {
      type: String
    },
    dataAlt: {
      type: String
    },
    dataFilename: {
      type: String
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    border: {
      type: Boolean,
      default: false
    },
    palette: {
      type: Object
    },
    fit: {
      type: String,
      default: 'cover'
    },
    isLazy: {
      type: Boolean,
      default: true
    },
    maxSrcWidth: {
      type: Number,
      default: 2400
    },
    quality: {
      type: Number,
      default: 90
    },
    fallbackEffectiveWidth: {
      type: Boolean,
      default: false
    },
    onLoad: {
      type: Function,
      default: () => {}
    },
    onError: {
      type: Function,
      default: () => {}
    },
    onComplete: {
      type: Function,
      default: () => {}
    },
    callback: {
      type: Boolean,
      required: false
    }
  },
  data() {
    return {
      isLoaded: false,
      isErrored: false,
      isFullyVisible: false,
      effectiveWidth: null,
      min_width: 200
    };
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onViewportResize);
  },
  created() {
    this.throttledResize = throttle(this.onViewportResizeThrottled, 300);
  },
  mounted() {
    window.addEventListener('resize', this.onViewportResize);
    window.requestAnimationFrame(this.onViewportResize);

    if (this.$refs.image) {
      this.$refs.image.addEventListener('load', () => {
        if (!this.isLoaded) {
          this.isLoaded = true;
          this.isComplete = true;
          this.onLoad();
          this.onComplete();
          setTimeout(() => {
            this.isFullyVisible = true;
          }, 400);
        }
      });

      if (this.$refs.image.complete && this.$refs.image.naturalWidth > 1) {
        if (!this.isLoaded) {
          this.isLoaded = true;
          this.isComplete = true;
          this.onLoad();
          this.onComplete();
          setTimeout(() => {
            this.isFullyVisible = true;
          }, 400);
        }
      }

      this.$refs.image.addEventListener('error', () => {
        this.isErrored = true;
        this.isComplete = true;
        this.onError();
        this.onComplete();
        setTimeout(() => {
          this.isFullyVisible = true;
        }, 400);
      });
    }
  },
  methods: {
    generateSrc() {
      if (!this.effectiveWidth) {
        // must return no src if effective width is not determined yet
        // otherwise it will download the asset as if it was the full size
        // of the viewport
        return '';
      }
      let min_width = this.width < this.min_width ? this.min_width : this.width;

      return `${this.src}${this.src.includes('?') ? '&' : '?'}q=${this.quality}&w=${Math.min(min_width, this.maxSrcWidth)}`;
    },
    generateSrcSet(format) {
      if (!this.effectiveWidth) {
        // must return no src if effective width is not determined yet
        // otherwise it will download the asset as if it was the full size
        // of the viewport
        return '';
      }

      let counter = Math.min(this.width, this.maxSrcWidth);
      let widths = [];

      let min_width = this.min_width;
      let diff = 200;

      if (counter <= min_width) {
        widths.push(counter);
      } else {
        while(counter > min_width) {
          widths.push(counter);
          counter -= diff;
        }
      }

      return widths
        .map(width => {
          return `${this.src}${this.src.includes('?') ? '&' : '?'}${format ? 'fm=' + format : ''}&q=${this.quality}&w=${width} ${width}w`;
        })
        .join(', ');
    },
    onViewportResize() {
      this.throttledResize();
    },
    onViewportResizeThrottled() {
      if (!this.$refs.image) {
        return;
      }

      let containerWidth = this.$refs.image.parentNode.parentNode.parentNode.offsetWidth;
      let containerHeight = this.$refs.image.parentNode.parentNode.parentNode.offsetHeight;
      let containerRatio = containerWidth / containerHeight;
      let sourceRatio = this.width / this.height;

      let newWidth = null;
      let newHeight = null;

      if (this.fit === 'cover') {
        if (containerRatio > sourceRatio) {
          newWidth = containerWidth;
          newHeight = Math.ceil(newWidth / sourceRatio);
        } else {
          newHeight = containerHeight;
          newWidth = Math.ceil(newHeight * sourceRatio);
        }
      } else if (this.fit === 'contain') {
        if (containerRatio > sourceRatio) {
          newHeight = containerHeight;
          newWidth = Math.ceil(newHeight * sourceRatio);
        } else {
          newWidth = containerWidth;
          newHeight = Math.ceil(newWidth / sourceRatio);
        }
      } else {
        newWidth = containerWidth;
      }

      this.effectiveWidth = Math.ceil(containerRatio > 1 ? window.innerWidth : window.innerHeight);

      if (!this.effectiveWidth && this.fallbackEffectiveWidth) {
        this.effectiveWidth = window.innerWidth;
      }
    }
  }
};
</script>

<style lang='scss'>

.responsive-image-wrapper {
  position: relative;

  &.--fill {
    @include abs-fill;
    overflow: hidden;

    picture.responsive-image-picture {
      @include abs-fill;

      img {
        @include abs-fill;
        object-fit: cover;
        object-position: 50% 50%;
      }
    }
  }

  picture {
    user-select: none;
    pointer-events: none;
  }

  picture.responsive-image-picture {
    position: relative;
  }

  .responsive-image-palette {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    opacity: 1;
    backface-visibility: hidden;
    will-change: opacity;
  }

  .responsive-image-fade {
    opacity: 0;
  }

  &.responsive-image-picture--is-loaded,
  &.responsive-image-picture--is-errored {
    .responsive-image-palette {
      opacity: 0;
      transition: opacity $speed-666 $ease-out $speed-666;
    }

    .responsive-image-fade {
      opacity: 1;
      transition: opacity $speed-666 $ease-out $speed-666;
    }
  }
}

</style>
