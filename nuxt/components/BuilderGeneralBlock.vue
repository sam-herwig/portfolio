<template>
  <section class="builder-general-block pad-bl block-outer">
    <div class="gutter-lg block-inner">
      <h2 v-if="title" class="general-title">{{ title }}</h2>
      <p v-if="text" class="general-text">{{ text }}</p>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  title: String,
  text: String
});
</script>

<style lang="scss">
.builder-general-block {
  // Outer block padding using span units
  &.block-outer {
    padding-top: span(2);
    padding-bottom: span(2);
    @include respond-to($tablet) {
      padding-top: span(3);
      padding-bottom: span(3);
    }
    @include respond-to($desktop) {
      padding-top: span(4);
      padding-bottom: span(4);
    }
  }
  .block-inner {
    width: 100%;
    max-width: span(12);
    margin: 0 auto;
    text-align: center;
    @include respond-to($tablet) {
      max-width: span(10);
    }
    @include respond-to($desktop) {
      max-width: span(8);
    }
  }
  .general-title {
    font-family: $poppins-extra-bold;
    margin-bottom: $space-m;
    color: $black;
    // font-size removed, handled by typography.scss
  }
  .general-text {
    font-family: $poppins;
    color: $black;
    line-height: 1.6;
    margin-bottom: 0;
    // font-size removed, handled by typography.scss
  }
}
</style> 