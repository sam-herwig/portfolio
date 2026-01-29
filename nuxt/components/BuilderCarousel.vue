<template>
  <section class="builder-carousel pad-bl block-outer">
    <div class="gutter-lg block-inner">
      <swiper
        :slides-per-view="3"
        :space-between="24"
        :loop="true"
        :pagination="{ clickable: true }"
        :navigation="true"
        :free-mode="{
          enabled: true,
          sticky: true,
          momentum: true,
          momentumRatio: 0.8,
          momentumBounce: true,
          momentumBounceRatio: 0.8
        }"
        :mousewheel="{
          forceToAxis: true,
          sensitivity: 1
        }"
        :grab-cursor="true"
        :touch-ratio="1.2"
        :resistance="true"
        :resistance-ratio="0.85"
        class="carousel-swiper"
        @slideChange="onSlideChange"
        :breakpoints="{
          0: { 
            slidesPerView: 1.5,
            freeMode: {
              enabled: true,
              sticky: false,
              momentum: true,
              momentumRatio: 0.6
            }
          },
          768: { 
            slidesPerView: 3,
            freeMode: {
              enabled: true,
              sticky: true,
              momentum: true,
              momentumRatio: 0.8
            }
          }
        }"
        :modules="modules"
      >
        <swiper-slide
          v-for="(img, i) in images"
          :key="img.src || i"
          class="carousel-slide"
          :class="{ 'active': i === currentIndex }"
          @click="openFullscreen(i)"
        >
          <img :src="img.src" :alt="img.alt || 'Carousel Image'" />
        </swiper-slide>
      </swiper>
      <div class="carousel-index">
        <span
          v-for="(img, i) in images"
          :key="`dot-${img.src || i}`"
          class="carousel-dot"
          :class="{ 'active': i === currentIndex }"
          @click="goTo(i)"
        />
      </div>
      <button class="carousel-fullscreen-btn" @click="toggleFullscreen">
        {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
      </button>
      <!-- Fullscreen overlay -->
      <div v-if="isFullscreen" class="carousel-fullscreen-overlay" @click.self="toggleFullscreen">
        <swiper
          :slides-per-view="1"
          :initial-slide="currentIndex"
          :loop="true"
          :pagination="{ clickable: true }"
          :navigation="true"
          class="carousel-swiper-fullscreen"
          :modules="modules"
        >
          <swiper-slide
            v-for="(img, i) in images"
            :key="`fullscreen-${img.src || i}`"
            class="carousel-slide-fullscreen"
          >
            <img :src="img.src" :alt="img.alt || 'Carousel Image'" />
          </swiper-slide>
        </swiper>
        <button class="carousel-fullscreen-exit" @click="toggleFullscreen">×</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

const modules = [Navigation, Pagination, FreeMode, Mousewheel];

const props = defineProps({
  images: {
    type: Array,
    required: true
  }
});
const currentIndex = ref(0);
const isFullscreen = ref(false);

const onSlideChange = (swiper) => {
  currentIndex.value = swiper.realIndex;
};
const goTo = (i) => {
  currentIndex.value = i;
};
const openFullscreen = (i) => {
  isFullscreen.value = true;
  currentIndex.value = i;
};
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};
</script>

<style lang="scss">
@import 'swiper/css';
@import 'swiper/css/navigation';
@import 'swiper/css/pagination';

.builder-carousel {
  &.block-outer {
    @include block-outer;
  }
  .block-inner {
    text-align: center;
    @include block-inner;
  }
  .carousel-swiper {
    width: 100%;
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
    
    .swiper-wrapper {
      transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .carousel-slide {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 span(0.5);
      opacity: 0.5;
      transition: opacity 0.3s ease, transform 0.3s ease;
      user-select: none;
      
      &.active { 
        opacity: 1; 
      }
      
      &:hover {
        transform: scale(1.02);
      }
      
      img {
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: $radius-xs;
        pointer-events: none;
      }
    }
  }
  .carousel-index {
    margin-top: $space-m;
    display: flex;
    justify-content: center;
    .carousel-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $ash;
      margin: 0 4px;
      cursor: pointer;
      &.active { background: $red; }
    }
  }
  .carousel-fullscreen-btn {
    margin-top: $space-m;
    background: $black;
    color: $white;
    border: none;
    border-radius: $radius-xs;
    padding: $space-xs $space-m;
    cursor: pointer;
    font-family: $poppins-semi-bold;
    &:hover { background: $red; color: $white; }
  }
  .carousel-fullscreen-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba($black, 0.95);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    .carousel-swiper-fullscreen {
      width: 90vw;
      max-width: 1200px;
      .carousel-slide-fullscreen {
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: $radius-xs;
        }
      }
    }
    .carousel-fullscreen-exit {
      position: absolute;
      top: 32px;
      right: 32px;
      font-size: 2.5rem;
      background: none;
      border: none;
      color: $white;
      cursor: pointer;
      z-index: 2100;
    }
  }
}
</style> 
