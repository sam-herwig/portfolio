import { defineField, defineType } from 'sanity';
import { TextIcon } from '@sanity/icons';
// Sanity Icon Set: https://icons.sanity.build/all

export default defineType({
  name: 'textBlock',
  title: 'Text Block',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'richtext',
      title: 'Copy',
      validation: [
        Rule => Rule.required()
      ],
      type: 'array',
      of: [{
        type: 'block',
        styles: [
          { title: 'Heading 1', value: 'h1' },
          { title: 'Heading 2', value: 'h2' },
          { title: 'Heading 3', value: 'h3' },
          { title: 'Normal', value: 'normal' } // Default style
        ],
        lists: [
          { title: 'Bullet', value: 'bullet' },
          { title: 'Numbered', value: 'number' }
        ],
        marks: {
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'External link',
              fields: [
                {
                  name: 'href',
                  type: 'url',
                  title: 'URL',
                  validation: Rule => Rule.uri({
                    scheme: ['http', 'https', 'mailto', 'tel']
                  })
                }
              ]
            }
          ]
        }
      }]
    })
  ]
});
