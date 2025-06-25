export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const projectId = config.public.sanity.projectId;
  
  // Redirect to the Sanity Studio
  return sendRedirect(event, `https://${projectId}.sanity.studio/`, 302);
}); 