<template>
  <picture
    class="responsive-image-picture"
    :class="{
      'responsive-image-picture--is-loaded': isLoaded,
      'responsive-image-picture--is-errored': isErrored,
      'responsive-image-picture--is-fade-in': isFadeIn,
      'responsive-image-picture--is-transparent': isTransparent,
      'responsive-image-picture--is-fully-visible': isFullyVisible
    }"
  >
    <div
      class="responsive-image-loader"
    />
    <source :srcset="generateSrcSet('avif')" type="image/avif" :sizes="`${effectiveWidth}px`">
    <source :srcset="generateSrcSet('webp')" type="image/webp" :sizes="`${effectiveWidth}px`">
    <source :srcset="src.endsWith('.png') ? generateSrcSet('png') : generateSrcSet('jpg')" :type="src.endsWith('.png') ? 'image/png' : 'image/jpeg'" :sizes="`${effectiveWidth}px`">
    <img
      class="responsive-image"
      :src="generateSrc()"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="isLazy ? 'lazy' : 'eager'"
      :style="{
        objectFit: fit === 'none' ? 'initial' : fit,
        objectPosition: `${focalPointX * 100}% ${focalPointY * 100}%`,
        position: fit === 'none' ? 'static' : 'absolute',
        height: fit === 'none' ? 'auto' : '100%'
      }"
      :sizes="`${effectiveWidth}px`"
      ref="image"
    >
  </picture>
</template>

<script>
import { default as throttle } from 'lodash/throttle.js';

export default {
  props: {
    src: {
      type: String
    },
    alt: {
      type: String
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    focalPointX: {
      type: Number,
      default: 0.5
    },
    focalPointY: {
      type: Number,
      default: 0.5
    },
    fit: {
      type: String,
      default: 'cover'
    },
    isLazy: {
      type: Boolean,
      default: true
    },
    isFadeIn: {
      type: Boolean,
      default: true
    },
    isTransparent: {
      type: Boolean,
      default: false
    },
    maxSrcWidth: {
      type: Number,
      default: 2800
    },
    quality: {
      type: Number,
      default: 80
    },
    onLoadCallback: {
      type: Function,
      default: () => {}
    },
    onErrorCallback: {
      type: Function,
      default: () => {}
    },
    onViewportResizeCallback: {
      type: Function,
      default: () => {}
    },
    onViewportResizeThrottledCallback: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      isLoaded: false,
      isErrored: false,
      isFullyVisible: false,
      containerWidth: null,
      containerHeight: null,
      containerRatio: null,
      sourceRatio: null,
      effectiveWidth: null,
      effectiveHeight: null
    };
  },
  beforeDestroy() {
    // this.$nuxt.$off('viewportResize', this.onViewportResize);
    window.removeEventListener("resize", this.onViewportResize);
  },
  created() {
    this.throttledResize = throttle(this.onViewportResizeThrottled, 300);
  },
  mounted() {
    // this.$nuxt.$on('viewportResize', this.onViewportResize);
    window.addEventListener("resize", this.onViewportResize);
    window.requestAnimationFrame(this.onViewportResize);

    if(this.$refs.image) {
      this.$refs.image.addEventListener('load', () => {
        if(!this.isLoaded) {
          window.setTimeout(() => {
            this.isLoaded = true;
          }, 0);
          this.onLoadCallback(this);
          window.setTimeout(() => {
            this.isFullyVisible = true;
          }, 333);
        }
      });

      if(this.$refs.image.complete && this.$refs.image.naturalWidth > 1) {
        if(!this.isLoaded) {
          window.setTimeout(() => {
            this.isLoaded = true;
          }, 0);
          this.onLoadCallback(this);
          window.setTimeout(() => {
            this.isFullyVisible = true;
          }, 333);
        }
      }

      this.$refs.image.addEventListener('error', () => {
        this.isErrored = true;
        this.onErrorCallback(this);
        window.setTimeout(() => {
            this.isFullyVisible = true;
          }, 333);
      });
    }
  },
  methods: {
    generateSrc() {
      if(!this.effectiveWidth) {
        // must return no src if effective width is not determined yet
        // otherwise it will download the asset as if it was the full size
        // of the viewport
        return '';
      }
      return `${this.src}${this.src.includes('?') ? '&' : '?'}q=${this.quality}&w=${this.maxSrcWidth}`;
    },
    generateSrcSet(format) {
      if(!this.effectiveWidth) {
        // must return no src if effective width is not determined yet
        // otherwise it will download the asset as if it was the full size
        // of the viewport
        return '';
      }

      let counter = Math.min(this.width, this.maxSrcWidth);
      let widths = [];

      if(counter <= 200) {
        widths.push(counter);
      } else {
        while(counter > 200) {
          widths.push(counter);
          counter -= 200;
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
      this.onViewportResizeCallback(this);
    },
    onViewportResizeThrottled() {
      if(!this.$refs.image) {
        return;
      }

      this.containerWidth = this.$refs.image.parentNode.parentNode.offsetWidth;
      this.containerHeight = this.$refs.image.parentNode.parentNode.offsetHeight;
      this.containerRatio = this.containerWidth / this.containerHeight;
      this.sourceRatio = this.width / this.height;

      let newWidth = null;
      let newHeight = null;

      if(this.fit === 'cover') {
        if(this.containerRatio > this.sourceRatio) {
          newWidth = this.containerWidth;
          newHeight = Math.ceil(newWidth / this.sourceRatio);
        } else {
          newHeight = this.containerHeight;
          newWidth = Math.ceil(newHeight * this.sourceRatio);
        }
      } else if(this.fit === 'contain') {
        if(this.containerRatio > this.sourceRatio) {
          newHeight = this.containerHeight;
          newWidth = Math.ceil(newHeight * this.sourceRatio);
        } else {
          newWidth = this.containerWidth;
          newHeight = Math.ceil(newWidth / this.sourceRatio);
        }
      } else {
        newWidth = this.containerWidth;
        newHeight = Math.ceil(newWidth / this.sourceRatio);
      }

      this.effectiveWidth = newWidth;
      this.effectiveHeight = newHeight;

      this.onViewportResizeThrottledCallback(this);
    }
  }
};
</script>

<style lang="scss" scoped>
.responsive-image-picture {
  display: block;
  width: 100%;
}

.responsive-image-loader {
  background-color: rgba($color: #000000, $alpha: 0.5);
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  transition: opacity $speed-metal;
  width: 100%;
  .responsive-image-picture--is-transparent & {
    background-color: transparent;
  }
  .responsive-image-picture--is-fully-visible & {
    opacity: 0;
  }
}

.responsive-image {
  display: block;
  left: 0;
  opacity: 0;
  top: 0;
  width: 100%;
  .responsive-image-picture--is-fade-in & {
    transition: opacity $speed-metal;
  }
  .responsive-image-picture--is-loaded &,
  .responsive-image-picture--is-errored & {
    opacity: 1;
  }
}
</style>
