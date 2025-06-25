import { useNuxtApp } from '#app';

export const useSanityData = async ({ query, params = {} }) => {
  const { $sanity } = useNuxtApp();
  
  try {
    if (!$sanity || !$sanity.getClient) {
      console.error('Sanity client not available');
      return null;
    }
    
    // Use the regular client
    const client = $sanity.getClient();
    
    // Fetch data
    const data = await client.fetch(query, params);
    
    return data;
  } catch (error) {
    console.error('Error fetching Sanity data:', error);
    return null;
  }
};
