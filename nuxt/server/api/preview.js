// Preview API handler for Nuxt 3
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // Debug the query parameters
  console.log('Preview API called with query:', query);
  
  // Check for required query parameters
  if (!query.secret) {
    console.error('Missing secret');
    return createError({
      statusCode: 401,
      message: 'Missing secret',
    });
  }
  
  // Get the preview secret from runtime config
  const config = useRuntimeConfig();
  const previewSecret = config.public.sanityPreviewSecret;
  
  console.log('Preview secret from config:', previewSecret);
  console.log('Secret from query:', query.secret);
  
  // Check the secret
  if (query.secret !== previewSecret) {
    console.error('Invalid secret');
    return createError({
      statusCode: 401,
      message: 'Invalid secret',
    });
  }
  
  // Set a preview cookie
  setCookie(event, 'preview', 'true', {
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });
  
  // Redirect to the slug with preview mode enabled
  const redirectPath = !query.slug || query.slug === 'home' ? 
    `/` : 
    `/${query.slug}`;
  
  console.log('Redirecting to:', redirectPath);
  
  return sendRedirect(event, redirectPath);
}); 