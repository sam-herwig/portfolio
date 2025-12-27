<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-item copyright">
        © Sam Herwig 2025
      </div>
      <div class="footer-item logo">
        <img src="/static/svgs/footer-logo.svg" alt="SH Logo" />
      </div>
      <div class="footer-item powered-by">
        Powered by Espresso
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.footer {
  background-color: $red;
  padding: $space-m $space-xl;
  color: $black;
  width: 100%;
  border-top: 3px solid $black;
  //  padding: 0 span(1);
}

.footer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  // padding: 0 $space-m;
  
  @include respond-to($tablet) {
    flex-direction: row;
   
  }
}

.footer-item {
  margin: $space-s 0;
  
  @include respond-to($tablet) {
    margin: 0;
  }
}

.logo {
  order: -1;
  
  @include respond-to($tablet) {
    order: 0;
  }
  
  img {
    width: 40px;
    height: auto;
  }
}

.copyright {
  text-align: center;
  
  @include respond-to($tablet) {
    text-align: left;
  }
}

.powered-by {
  text-align: center;
  
  @include respond-to($tablet) {
    text-align: right;
  }
}
</style>
