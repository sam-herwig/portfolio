import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';
// Sanity Icon Set: https://icons.sanity.build/all

export default defineType({
  name: 'home',
  title: 'Home',
  type: 'document',
  singleton: true,
  icon: HomeIcon,
  fieldsets: [
    {
      name: 'hero',
      title: 'Hero'
    }, 
    {
      name: 'work',
      title: 'Work'
    },
    {
      name: 'projects',
      title: 'Projects'
    }
  ],
  fields: [
    defineField({
      fieldset: 'hero',
      name: 'heroImage',
      title: 'Image',
      type: 'image'
    }),
    defineField({
      fieldset: 'hero',
      name: 'heroTitle',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      fieldset: 'hero',
      name: 'heroSubtitle',
      title: 'Subtitle',
      type: 'string'
    }), 
    defineField({
      fieldset: 'work',
      name: 'workTitle',
      title: 'Title',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ],
    }),
    defineField({
      fieldset: 'projects',
      name: 'projectsTitle',
      title: 'Projects Section Title',
      type: 'string',
      initialValue: 'PROJECTS',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'projects',
      name: 'projects',
      title: 'Projects',
      type: 'array',
      validation: [
        Rule => Rule.required().unique().error('Must include at least 1 project')
      ],
      of: [
        {
          type: 'reference',
          to: [{ type: 'project' }]
        }
      ]
    })
  ]
});
