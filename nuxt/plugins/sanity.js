export default defineNuxtPlugin(async () => {
  const store = useSiteStore();
  const route = useRoute();

  // Fetch global page data on start
  await store.fetchSiteContent();
});
