<template>
  <section class="hero-wrapper">
    <div class="hero-inner">
      <div class="hero-titles">
        <h1 class="main-title">Sam Herwig</h1>
        <h6 class="work-title">Front End Web Developer</h6>
      </div>
      <!-- <button @click="increment">Count is: {{ count }}</button>
      <button @click="increment">Count is: {{ count }}</button> -->
    </div>
  </section>

</template> 

<script setup>
import { ref, onMounted, data } from 'vue'

// reactive state
const count = ref(0)

console.log(count);

// data() {
//   return{
//     samImg: {
//       src: 
//     }
//   }
// };

// functions that mutate state and trigger updates
function increment() {
  count.value++
  console.log(count);
}

// lifecycle hooks
onMounted(() => {
  console.log(`The initial count is ${count.value}.`)
})

</script>

<style lang="scss">
// @import "@/assets/styles/_variables.scss";

.hero-wrapper {
//  padding: span(2);

  .hero-inner {
    // background-color: $white;
    padding: span(3) 0;

    .hero-titles {
      margin: 0 auto;
      width: max-content;
    }

    .main-title {
    }

    .work-title {
    }

  }
}


</style>