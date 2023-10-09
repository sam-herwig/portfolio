<template>
  <section class="hero-wrapper">
    <div class="hero-inner">
      <div class="hero-titles">
        <h1 class="main-title h2">I'm <span>Sam Herwig</span></h1>
        <h6 class="work-title">Front End Web Developer</h6>
      </div>
      <div class="sam-image">
        <ResponsiveImage 
         v-bind="samImage"
        />
      </div>
    </div>
  </section>

</template> 

<script>

export default {
  props: {
    samImage: {
      type: Object
    }
  }
}

</script>

<style lang="scss">

.hero-wrapper {
  position: relative;
  background: linear-gradient(to bottom right, $black 50%, $blue);

  // &:before {
  //   content: ''; 
  //   position: absolute;
  //   left: 0; 
  //   bottom: -50px; 
  //   width: 100%; 
  //   height: 100px; 
  //   background-color: $blue;
  // }

  .hero-inner {
    padding: span(2);
    display: flex; 
    align-items: center;
    justify-content: space-between;

    .hero-titles {
      width: span(16);
    }

    .main-title {
      margin-bottom: $margin-large;

      span {
        display: block;
      }
    }

    .work-title {
    }

    .sam-image {
      position: relative; 
      width: span(10); 
      @include aspect-ratio(80%); 

      img {
        @include abs-fill;
      }

    }

  }
}


</style>