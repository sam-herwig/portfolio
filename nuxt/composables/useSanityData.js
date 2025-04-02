import debounce from 'debounce';

export default async function ({ query, params }) {
  const route = useRoute();
  const isPreview = route.query && route.query.preview === 'true' ? true : false;
  const sanityClient = isPreview
    ? {
        client: 'preview',
        server: false,
        initialCache: false
      }
    : undefined;

  onMounted(() => {
    if (isPreview) {
      const sanity = useSanity('preview');
      const debouncedRefresh = debounce(refresh, 1000);

      sanity.client.listen(query, params, { includeResult: true }).subscribe((event) => {
        if (event.result) {
          debouncedRefresh();
        }
      });
    }
  });

  const { data, refresh } = await useLazySanityQuery(query, params, sanityClient);

  return data;
}
