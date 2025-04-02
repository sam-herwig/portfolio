<template>
  <section class="builder-pull-quote pad-bl">
    <div class="gutter-lg">
      <h4 v-if="quote" class="alt">“{{ quote.replace(/(“|”|")/gi, '').replace(/(')/gi, '’') }}”</h4>
      <p v-if="citee" class="nav-a1">— {{ citee.replace(/(-|–|—)/gi, '').trim() }}</p>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  quote: {
    type: String
  },
  citee: {
    type: String
  }
});
</script>

<style lang='scss'>
.builder-pull-quote {
  .gutter-lg {
    text-align: center;
  }

  h4 {
    margin: 0 span(1);
    text-transform: none;
  }

  .nav-a1 {
    margin-top: $space-l;
  }

  @include respond-to($desktop) {
    h4 {
      width: 100%;
      max-width: 1024px;
      margin: 0 auto;
    }
  }
}
</style>
