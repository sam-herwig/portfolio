import { defineNuxtPlugin } from '#app';
import { enableVisualEditing } from '@sanity/visual-editing/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  
  // Only enable visual editing if preview mode is active
  const previewCookie = useCookie('preview');
  if (previewCookie.value === 'true') {
    console.log('Enabling Visual Editing');
    enableVisualEditing({
      projectId: config.public.sanity.projectId,
      dataset: config.public.sanity.dataset,
      studioUrl: '/studio',
    });
  }
}); 