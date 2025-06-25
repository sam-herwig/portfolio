export default {
  name: 'carousel',
  title: 'Carousel',
  type: 'object',
  fields: [
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              options: { isHighlighted: true }
            }
          ]
        }
      ],
      validation: Rule => Rule.required().min(1).max(12)
    }
  ],
  preview: {
    select: {
      images: 'images'
    },
    prepare({ images }) {
      return {
        title: `Carousel (${images?.length || 0} images)` || 'Carousel',
        media: images && images[0]
      };
    }
  }
}; 