<template>
  <NuxtLayout>
    <div class="page error-page">
      <div class="header">
        <NuxtLink class="logo marg-l" to="/">Home</NuxtLink>
      </div>
      <section>
        <div class="gutter">
          <h2>Error 404!</h2>
          <p>The page you requested doesn’t exist.</p>
        </div>
      </section>
      <Footer />
    </div>
  </NuxtLayout>
</template>

<script setup>
const error = useError();
</script>

<style lang='scss'>
.error-page {
  .header {
    height: $header-height;
    display: flex;
    align-items: center;

    .logo {
      position: relative;
      width: 104px;
      height: 20px;
      font-size: 0px;
      color: transparent;
      overflow: hidden;
      display: inline-flex;
      flex-shrink: 0;
    }
  }

  section {
    margin-bottom: span(2);
    padding: span(3) 0 span(5);
    border-bottom: 1px solid $ash;

    p {
      margin-top: $space-m;
    }
  }

  @include respond-to($mobile) {
    .logo {
      width: 122px;
      height: 24px;
    }
  }

  @include respond-to($tablet) {
    section {
      padding: span(2) 0 span(4);
    }
  }

  @include respond-to($large-tablet) {
    section {
      margin-bottom: span(1);
      padding: span(1) 0 span(2);
    }
  }
}
</style>
