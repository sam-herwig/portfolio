<template>
  <section class="intro-wrapper">
    <div class="intro-inner">
      <div class="into-titles">
        <h3 class="main-title">Oh Hey</h3>
        <p class="p1">
          I am a developing developer in Denver, CO making rad websites for Consume and Create. 
          I work primariliy in Vue with Nuxt on top. <span>CMS-capable.</span> <span>Flex Box Efficianado.</span>
        <span>Three.js Enjoyer.</span> <span>Shader Compliant.</span> <span>Consistently Confused.</span>
        </p>
      </div>
    </div>
  </section>
</template> 



<script setup>
import { ref, onMounted } from 'vue'



</script>


<style lang="scss"> 
.intro-wrapper {


  .intro-inner {


    .main-title {
      margin: 0 auto; 
      width: max-content; 
    }

    .p1 {
      width: span(14); 
      margin: 0 auto; 

      span {
        color: $blue;
      }
    }
  }
}

</style>