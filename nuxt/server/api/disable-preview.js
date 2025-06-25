export default defineEventHandler(async (event) => {
  // Clear the preview cookie or session
  setCookie(event, 'preview', '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });
  
  // Return success response
  return { success: true };
}); 