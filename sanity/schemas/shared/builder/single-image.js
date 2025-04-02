import { defineField, defineType } from 'sanity';
import { getExtension, getImageDimensions } from '@sanity/asset-utils';
import { ImageIcon } from '@sanity/icons';

export default defineType({
  name: 'singleImage',
  title: 'Image',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      validation: [
        Rule => Rule.custom((value) => {
          const filetype = getExtension(value.asset._ref);

          if (!value || !value.asset) {
            return 'Please upload or select an image';
          }

          if (filetype !== 'jpg' && filetype !== 'png') {
            return 'Image must be a JPG or PNG. GIFs need to be converted to .mov (https://convertio.co/gif-mov) and then uploaded to Vimeo'
          }

          return true;
        })
      ],
      options: {
        hotspot: false
      }
    })
  ],
  preview: {
    select: {
      image: 'image.asset',
      title: 'image.asset.originalFilename'
    },
    prepare: ({ image, title }) => {
      return {
        media: image ? image : ImageIcon,
        title: image ? title : 'Must select an image'
      }
    }
  }
});
