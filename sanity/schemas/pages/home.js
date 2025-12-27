import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';
// Sanity Icon Set: https://icons.sanity.build/all

export default defineType({
  name: 'home',
  title: 'Home Page',
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
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true
      },
      description: 'Main image for the hero section'
    }),
    defineField({
      fieldset: 'hero',
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Title for the hero section'
    }),
    defineField({
      fieldset: 'hero',
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'string',
      description: 'Subtitle for the hero section'
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
      title: 'Featured Projects',
      type: 'array',
      validation: [
        Rule => Rule.required().unique().error('Must include at least 1 project')
      ],
      of: [
        {
          type: 'reference',
          to: [{ type: 'project' }]
        }
      ],
      description: 'Select projects to feature on the home page'
    }),
    defineField({
      name: 'expandableGallery',
      title: 'Expandable Gallery Section',
      type: 'expandableGallery',
      description: 'Configure the expandable gallery section'
    })
  ],
  preview: {
    select: {
      title: 'heroTitle'
    },
    prepare({ title }) {
      return {
        title: title || 'Home Page'
      }
    }
  }
});
