<template>
  <section class="intro-wrapper">
    <div class="intro-inner">
      <div class="intro-image">
        <ResponsiveImage 
         v-bind="introImage"
        />
      </div>
      <div class="intro-content">
        <h2 class="main-title">Oh Hey</h2>
        <div class="intro-copy">
        <p class="p1">
          I am a developing developer in Denver, CO making rad websites for Consume and Create. 
          I work primariliy in Vue with Nuxt on top. 
        </p>
        <ul>
          <li>CMS-capable.</li>
          <li>Flex Box Efficianado.</li>
          <li>Shader Compliant.</li>
          <li>Three.js Enjoyer.</li>
          <li>Consistently Confused.</li>
        </ul>
      </div>
      </div>
    </div>
  </section>
</template> 



<script>
export default {
  props: {
    introImage: {
      type: Object
    }
  }
}
</script>


<style lang="scss"> 
.intro-wrapper {

  .intro-inner {
    padding: span(2);
    display: flex; 
    align-items: center;
    justify-content: space-between;

    .intro-image {
      position: relative; 
      width: span(10); 
      @include aspect-ratio(85%); 

      img {
        @include abs-fill;
      }

    }

    .intro-content {
      width: span(16);
    }

    .main-title {
      margin-bottom: $margin-normal;
    }

    .intro-copy {
      display: flex; 
      align-items: flex-start;
      justify-content: space-between;
    }

    .p1 {
      width: span(10); 
    }

    ul {
      width: span(6);
      // text-align: right;

      li {
        color: $blue; 
      }
    }
  }
}

</style>