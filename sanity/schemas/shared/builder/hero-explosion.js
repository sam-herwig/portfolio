import { defineField, defineType } from 'sanity';
import { ImageIcon } from '@sanity/icons';

export default defineType({
  name: 'heroExplosion',
  title: 'Hero Explosion',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'centerImage',
      title: 'Center Image',
      type: 'image',
      description: 'The main image at the center',
      options: { hotspot: true },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'explosionImages',
      title: 'Explosion Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Add images that will be displayed in the explosion effect',
      validation: Rule => Rule.min(0).max(20)
    }),
    defineField({
      name: 'explosionVideos',
      title: 'Explosion Videos',
      type: 'array',
      of: [{ type: 'file', title: 'Video', options: { accept: 'video/*' } }],
      description: 'Add videos that will be displayed in the explosion effect (muted, autoplay)',
      validation: Rule => Rule.min(0).max(20)
    }),
    defineField({
      name: 'totalMediaValidation',
      title: 'Total Media Validation',
      type: 'string',
      hidden: true,
      validation: Rule => Rule.custom((_, context) => {
        const { parent } = context;
        const imagesCount = parent?.explosionImages?.length || 0;
        const videosCount = parent?.explosionVideos?.length || 0;
        const totalCount = imagesCount + videosCount;
        return totalCount >= 3 && totalCount <= 40 
          ? true 
          : 'You must add at least 3 media items (images + videos) and no more than 40 in total';
      })
    }),
    defineField({
      name: 'animationDuration',
      title: 'Animation Duration (seconds)',
      type: 'number',
      initialValue: 1.5,
      validation: Rule => Rule.required().min(0.5).max(5)
    }),
    defineField({
      name: 'staggerDelay',
      title: 'Stagger Delay (seconds)',
      description: 'Delay between each image animation',
      type: 'number',
      initialValue: 0.05,
      validation: Rule => Rule.required().min(0).max(0.5)
    })
  ],
  preview: {
    select: {
      media: 'centerImage',
      title: 'centerImage.asset.originalFilename',
      subtitle: 'explosionImages.length'
    },
    prepare: ({ media, title, subtitle }) => {
      return {
        media: media,
        title: title || 'Hero Explosion',
        subtitle: subtitle ? `${subtitle} explosion images` : 'No explosion images'
      }
    }
  }
}); 