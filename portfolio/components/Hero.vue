<template>
  <section class="hero-wrapper">
    <div class="hero-inner">
      <h1>Sam Herwig</h1>
      <button @click="increment">Count is: {{ count }}</button>
    </div>
  </section>

</template> 

<script setup>
import { ref, onMounted } from 'vue'

// reactive state
const count = ref(0)

// functions that mutate state and trigger updates
function increment() {
  count.value++
}

// lifecycle hooks
onMounted(() => {
  console.log(`The initial count is ${count.value}.`)
})
</script>

<style lang="scss">
// @import "@/assets/styles/_variables.scss";

.hero-wrapper {
 padding: span(2);

  .hero-inner {
    background-color: $white;
    padding: span(4) 0;

    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
  }
}


</style>