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
  
  // For the presentation tool, we accept either the configured secret or the placeholder
  const isValidSecret = query.secret === previewSecret || query.secret === 'SANITY_PREVIEW_SECRET';
  
  // Check the secret
  if (!isValidSecret) {
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
  
  // Handle Sanity Visual Editing parameters
  const pathname = query['sanity-preview-pathname'] || (query.slug === 'home' ? '/' : `/${query.slug || ''}`);
  
  console.log('Redirecting to:', pathname);
  
  return sendRedirect(event, pathname);
}); 