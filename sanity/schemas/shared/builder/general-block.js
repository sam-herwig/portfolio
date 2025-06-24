import { defineField, defineType } from 'sanity';
import { EditIcon } from '@sanity/icons';

export default defineType({
  name: 'generalBlock',
  title: 'General Block',
  type: 'object',
  icon: EditIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'text'
    },
    prepare: ({ title, subtitle }) => ({
      title: title || 'General Block',
      subtitle: subtitle ? (subtitle.length > 50 ? subtitle.substring(0, 50) + '...' : subtitle) : 'No text'
    })
  }
}); 