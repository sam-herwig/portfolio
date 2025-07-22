<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="media-modal" @click="handleBackdropClick">
        <div class="media-modal__backdrop"></div>
        <div class="media-modal__content" @click.stop>
          <button class="media-modal__close" @click="close" aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          
          <img
            v-if="media.type === 'image'"
            :src="media.src"
            :alt="media.alt || ''"
            class="media-modal__media"
          />
          
          <video
            v-else-if="media.type === 'video'"
            :src="media.src"
            class="media-modal__media"
            controls
            autoplay
            :loop="media.loop"
            :muted="media.muted"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  media: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const close = () => {
  // Pause video if playing
  const video = document.querySelector('.media-modal__media[controls]')
  if (video) {
    video.pause()
  }
  emit('close')
}

const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    close()
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
.media-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  &__backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
  }

  &__content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__media {
    max-width: 100%;
    max-height: 90vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  &__close {
    position: absolute;
    top: -40px;
    right: 0;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.7;
    }

    @media (max-width: 768px) {
      top: -50px;
      right: -10px;
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>