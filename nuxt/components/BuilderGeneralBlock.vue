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
    @include block-outer;
  }
  .block-inner {
    text-align: center;
    @include block-inner;
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
