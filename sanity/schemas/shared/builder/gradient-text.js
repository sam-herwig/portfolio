import { defineField, defineType } from 'sanity';
import { EditIcon } from '@sanity/icons';

export default defineType({
  name: 'gradientText',
  title: 'Gradient Text',
  type: 'object',
  icon: EditIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The main heading text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'The descriptive text below the title',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
      description: 'The text for the link',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'url',
      description: 'The URL for the link',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'gradientStartColor',
      title: 'Gradient Start Color',
      type: 'string',
      description: 'The starting color of the gradient (hex code)',
      initialValue: '#0000ff', // Blue
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'gradientEndColor',
      title: 'Gradient End Color',
      type: 'string',
      description: 'The ending color of the gradient (hex code)',
      initialValue: '#ff0000', // Red
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'animationDuration',
      title: 'Animation Duration (seconds)',
      type: 'number',
      description: 'Duration of the ambient motion animation',
      initialValue: 10,
      validation: Rule => Rule.required().min(1).max(30)
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description'
    },
    prepare: ({ title, subtitle }) => {
      return {
        title: title || 'Gradient Text',
        subtitle: subtitle ? (subtitle.length > 50 ? subtitle.substring(0, 50) + '...' : subtitle) : 'No description'
      }
    }
  }
});
