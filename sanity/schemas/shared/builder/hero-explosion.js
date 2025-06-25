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
      description: 'The main image at the center (optional)',
      options: { hotspot: true }
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The main title that will fade in'
    }),
    defineField({
      name: 'text',
      title: 'Text Content',
      type: 'text',
      description: 'Text content that will fade in below the title'
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'string',
      description: 'URL for the call-to-action button'
    }),
    defineField({
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
      description: 'Text for the call-to-action button',
      initialValue: 'Learn More'
    }),
    defineField({
      name: 'fadeInDelay',
      title: 'Fade In Delay (seconds)',
      type: 'number',
      description: 'Delay before the text content fades in',
      initialValue: 2,
      validation: Rule => Rule.min(0).max(10)
    })
  ],
  preview: {
    select: {
      media: 'centerImage',
      title: 'title',
      subtitle: 'text'
    },
    prepare: ({ media, title, subtitle }) => {
      return {
        media: media,
        title: title || 'Hero Explosion',
        subtitle: subtitle ? (subtitle.length > 40 ? subtitle.substring(0, 40) + '...' : subtitle) : 'Gradient background with text'
      }
    }
  }
}); 