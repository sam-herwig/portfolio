export const typeFilter = function(type, slug) {
  if (slug) {
    if (!slug.includes('^')) {
      slug = `'${slug}'`;
    }
    return `
      coalesce(
        *[_type == '${type}' && slug.current == ${slug} && _id in path('drafts.**')][0],
        *[_type == '${type}' && slug.current == ${slug}][0]
      )
    `;
  } else {
    return `
      coalesce(
        *[_type == '${type}' && _id in path('drafts.**')][0],
        *[_type == '${type}'][0],
      )
    `;
  }
};

export const imageProps = `
  {
    'src': asset->url,
    'dataFilename': asset->originalFilename,
    'dataTitle': asset->title,
    'dataAlt': asset->altText,
    'width': asset->metadata.dimensions.width,
    'height': asset->metadata.dimensions.height
  }
`;
