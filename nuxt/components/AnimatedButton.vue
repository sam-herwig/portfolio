<template>
  <component
    :is="isExternalLink ? 'a' : (to ? 'NuxtLink' : 'button')"
    ref="buttonRef"
    :to="!isExternalLink ? to : undefined"
    :href="isExternalLink ? to : undefined"
    :target="isExternalLink ? '_blank' : undefined"
    :rel="isExternalLink ? 'noopener noreferrer' : undefined"
    :class="['animated-button', variant, props.class]"
  >
    <div class="button-content">
      <div class="button-dot"></div>
      <span class="button-text">
        {{ text }}
      </span>
    </div>

    <div class="button-hover-content">
      <span class="button-text">{{ text }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="button-arrow"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </div>
  </component>
</template>

<script setup>
import { ref, computed } from 'vue';
import { cn } from '~/utils/cn';

const props = defineProps({
  text: {
    type: String,
    default: 'Button'
  },
  class: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: null
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value)
  }
});

const buttonRef = ref(null);

// Check if the link is external
const isExternalLink = computed(() => {
  return props.to && (props.to.startsWith('http://') || props.to.startsWith('https://'));
});
</script>

<style lang="scss" scoped>
.animated-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: $poppins-semi-bold;
  text-decoration: none;
  @include pill($white, $white, transparent, 0.75rem, 2rem, 1.125rem);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 180px;
  
  &:hover {
    background: $white;
    color: $black;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($black, 0.3);
    
    .button-content {
      transform: translateY(-40px);
      opacity: 0;
    }
    
    .button-hover-content {
      transform: translate(-50%, -50%);
      opacity: 1;
    }
    
    .button-dot {
      transform: scale(1.8);
    }
  }
  
  &.secondary {
    border-color: $white;
    
    &:hover {
      background: $white;
      color: $black;
    }
  }
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.button-dot {
  width: 8px;
  height: 8px;
  background: $white;
  border-radius: $radius-xs;
  transition: transform 0.3s ease;
}

.button-text {
  white-space: nowrap;
}

.button-hover-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateY(40px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: all 0.3s ease;
  width: 100%;
  
  .button-text {
    color: $black;
  }
}

.button-arrow {
  width: 20px;
  height: 20px;
}
</style>
