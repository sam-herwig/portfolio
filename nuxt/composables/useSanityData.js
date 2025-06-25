import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';
import { useCookie } from '#app';

export const useSanityData = async ({ query, params = {}, preview = false }) => {
  const route = useRoute();
  const { $sanity } = useNuxtApp();
  
  // Check if preview mode is enabled from URL or cookie
  const previewCookie = useCookie('preview');
  const isPreview = preview || route.query.preview === 'true' || previewCookie.value === 'true';
  
  try {
    if (!$sanity || !$sanity.getClient) {
      console.error('Sanity client not available');
      return null;
    }
    
    // Use the appropriate client based on preview mode
    const client = $sanity.getClient(isPreview);
    
    // Fetch data
    const data = await client.fetch(query, params);
    
    return data;
  } catch (error) {
    console.error('Error fetching Sanity data:', error);
    return null;
  }
};
