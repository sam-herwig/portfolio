import { defineNuxtPlugin } from 'nuxt/app';
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export default defineNuxtPlugin((nuxtApp) => {
  // Get runtime config
  const runtimeConfig = useRuntimeConfig();
  
  // Log environment variables for debugging
  console.log('Runtime config in plugin:', runtimeConfig.public.sanity);
  
  const config = {
    projectId: runtimeConfig.public.sanity.projectId,
    dataset: runtimeConfig.public.sanity.dataset,
    apiVersion: runtimeConfig.public.sanity.apiVersion,
    useCdn: runtimeConfig.public.sanity.useCdn,
  };
  
  console.log('Sanity config:', config);

  // Create regular client
  const client = createClient(config);

  // Create preview client (for draft content)
  const previewClient = createClient({
    ...config,
    useCdn: false,
    token: runtimeConfig.sanityApiToken,
  });

  // Use the preview client if preview mode is enabled
  const getClient = (usePreview = false) => usePreview ? previewClient : client;

  // Set up image URL builder
  const builder = imageUrlBuilder(client);
  const urlFor = (source) => {
    if (!source) return '';
    return builder.image(source);
  };

  // Provide to the app
  return {
    provide: {
      sanity: {
        client,
        previewClient,
        getClient,
        urlFor,
      },
    },
  };
});
