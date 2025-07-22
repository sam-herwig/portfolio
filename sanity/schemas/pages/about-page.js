import { UsersIcon } from '@sanity/icons'

export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  icon: UsersIcon,
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        {
          name: 'heading',
          title: 'Main Heading',
          type: 'string',
          validation: Rule => Rule.required()
        },
        {
          name: 'subheading',
          title: 'Subheading',
          type: 'string'
        },
        {
          name: 'circularText',
          title: 'Circular Text',
          type: 'string',
          description: 'Text that rotates around the center image'
        },
        {
          name: 'centerImage',
          title: 'Center Image',
          type: 'image',
          options: {
            hotspot: true
          }
        }
      ]
    },
    {
      name: 'skillsSection',
      title: 'Skills Section',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string',
          description: 'Title displayed at the top of the skills section'
        },
        {
          name: 'skills',
          title: 'Skills',
          type: 'array',
          of: [{type: 'string'}],
          description: 'List of skills that will appear as animated pill buttons',
          validation: Rule => Rule.required().min(1)
        }
      ]
    },
    {
      name: 'experienceTimeline',
      title: 'Experience Timeline',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string'
        },
        {
          name: 'experiences',
          title: 'Experiences',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'experience',
              fields: [
                {
                  name: 'companyName',
                  title: 'Company/Project Name',
                  type: 'string',
                  validation: Rule => Rule.required()
                },
                {
                  name: 'roleTitle',
                  title: 'Role Title',
                  type: 'string',
                  validation: Rule => Rule.required()
                },
                {
                  name: 'dateRange',
                  title: 'Date Range',
                  type: 'string'
                },
                {
                  name: 'description',
                  title: 'Description',
                  type: 'text'
                },
                {
                  name: 'achievements',
                  title: 'Key Achievements',
                  type: 'array',
                  of: [{type: 'string'}]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'personalSection',
      title: 'Personal Section',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string'
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          of: [
            {
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'H3', value: 'h3'}
              ]
            }
          ]
        },
        {
          name: 'backgroundColor',
          title: 'Background Color',
          type: 'string',
          options: {
            list: [
              {title: 'Orange', value: 'orange'},
              {title: 'Green', value: 'green'},
              {title: 'Purple', value: 'purple'},
              {title: 'Dark', value: 'dark'}
            ]
          }
        }
      ]
    },
    {
      name: 'ctaSection',
      title: 'Call to Action Section',
      type: 'object',
      fields: [
        {
          name: 'heading',
          title: 'Heading',
          type: 'string'
        },
        {
          name: 'buttonText',
          title: 'Button Text',
          type: 'string'
        },
        {
          name: 'buttonLink',
          title: 'Button Link',
          type: 'string'
        },
        {
          name: 'secondaryLinkText',
          title: 'Secondary Link Text',
          type: 'string'
        },
        {
          name: 'secondaryLink',
          title: 'Secondary Link',
          type: 'string'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title'
    },
    prepare() {
      return {
        title: 'About Page'
      }
    }
  }
}