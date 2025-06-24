<template>
  <section class="builder-general-block pad-bl">
    <div class="gutter-lg">
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
  .gutter-lg {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
    padding: 2rem 0;
  }
  .general-title {
    font-family: $poppins-extra-bold;
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: $black;
  }
  .general-text {
    font-family: $poppins;
    font-size: 1.25rem;
    color: $black;
    line-height: 1.6;
    margin-bottom: 0;
  }
}
</style> 