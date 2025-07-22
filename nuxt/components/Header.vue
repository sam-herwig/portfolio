<template>
  <header :class="{ 'transparent': isTransparent, 'visible': isVisible }">
    <div class="header-content">
      <div class="logo-container">
        <NuxtLink to="/">
          <img src="/static/svgs/hero-logo.svg" alt="Logo" class="header-logo" />
        </NuxtLink>
      </div>
      <nav class="header-nav">
        <ul>
          <li><NuxtLink to="/about">About</NuxtLink></li>
          <li><NuxtLink to="/contact">Contact</NuxtLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const isTransparent = ref(true);
const isVisible = ref(true);
const lastScrollPosition = ref(0);
const scrollThreshold = 50; // Threshold in pixels for when to change header visibility

// Handle scroll events
const handleScroll = () => {
  const currentScrollPosition = window.scrollY;
  
  // Determine if we should be transparent (at the top of the page)
  isTransparent.value = currentScrollPosition < 100;
  
  // Determine if we should show/hide the header based on scroll direction
  if (currentScrollPosition < lastScrollPosition.value || currentScrollPosition < scrollThreshold) {
    // Scrolling up or at the top - show header
    isVisible.value = true;
  } else if (currentScrollPosition > lastScrollPosition.value && currentScrollPosition > scrollThreshold) {
    // Scrolling down and past threshold - hide header
    isVisible.value = false;
  }
  
  // Update last scroll position
  lastScrollPosition.value = currentScrollPosition;
};

// Set up and clean up scroll event listener
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  // Initialize scroll position
  lastScrollPosition.value = window.scrollY;
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style lang="scss">
header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: $header-height;
  z-index: 1000;
  transition: all 0.1s ease-in;

  
  &.transparent {
    background-color: transparent;
    
    .header-nav a {
      color: $black;
    }
  }
  
  &:not(.transparent) {
    background-color: $white;
    box-shadow: 0 2px 10px rgba($black, 0.1);
    
    .header-nav a {
      color: $black;
    }
    
    .header-logo {
      filter: none;
    }
  }
  
  &.visible {
    transform: translateY(0);
  }
  
  &:not(.visible) {
    transform: translateY(-100%);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 $space-xl;
    max-width: 1440px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    height: 100%;
    margin-top: 6px;
  }
  
  .logo-container {
    .header-logo {
      height: 40px;
      width: auto;
      transition: filter 0.3s ease;
    }
  }
  
  .header-nav {
    ul {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      
      li {
        margin-left: 2rem;
        
        a {
          text-decoration: none;
          font-family: $poppins-semi-bold;
          font-size: 16px;
          transition: color 0.3s ease;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
  
  /* Tablet and desktop styles */
  @media #{$tablet} {
    .header-content {
      padding: 0 $space-xl;
      margin-top: 0;
    }
  }
  
  @media #{$desktop} {
    .header-content {
      padding: 0 $space-xxl;
    }
  }
  
  /* Mobile styles */
  @media (max-width: 767px) {
    height: 50px;
    
    .header-content {
      // padding: 0 $space-m;
    }
    
    .logo-container {
      .header-logo {
        height: 30px;
      }
    }
    
    .header-nav {
      ul {
        li {
          margin-left: 1rem;
          
          a {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>
