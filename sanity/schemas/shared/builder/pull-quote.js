import { defineField, defineType } from 'sanity';
import { BlockquoteIcon } from '@sanity/icons';
// Sanity Icon Set: https://icons.sanity.build/all

export default defineType({
  name: 'pullQuote',
  title: 'Pull Quote',
  type: 'object',
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Quote',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      name: 'citee',
      title: 'Citee',
      type: 'string'
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'citee'
    }
  }
});
