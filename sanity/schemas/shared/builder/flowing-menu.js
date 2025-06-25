import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'flowingMenu',
  title: 'Flowing Menu',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      description: 'Title displayed above the flowing menu',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      options: {
        list: [
          { title: 'Black', value: 'black' },
          { title: 'Dark Black', value: 'dark-black' },
          { title: 'Red', value: 'red' },
          { title: 'White', value: 'white' }
        ]
      },
      description: 'Background color for the flowing menu section',
      initialValue: 'black'
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      options: {
        list: [
          { title: 'White', value: 'white' },
          { title: 'Black', value: 'black' },
          { title: 'Red', value: 'red' }
        ]
      },
      description: 'Text color for the flowing menu items',
      initialValue: 'white'
    }),
    defineField({
      name: 'projects',
      title: 'Select Projects',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'project' }]
        }
      ],
      description: 'Select projects to display in the flowing menu',
      validation: Rule => Rule.required().min(1).error('At least one project is required')
    }),
    defineField({
      name: 'enableTags',
      title: 'Enable Tag Filtering',
      type: 'boolean',
      description: 'Enable filtering projects by tags',
      initialValue: true
    }),
    defineField({
      name: 'height',
      title: 'Section Height',
      type: 'string',
      options: {
        list: [
          { title: 'Small (50vh)', value: '50vh' },
          { title: 'Medium (70vh)', value: '70vh' },
          { title: 'Large (90vh)', value: '90vh' },
          { title: 'Full Screen (100vh)', value: '100vh' }
        ]
      },
      description: 'Height of the flowing menu section',
      initialValue: '70vh'
    })
  ],
  preview: {
    select: {
      title: 'title',
      projectCount: 'projects.length'
    },
    prepare({ title, projectCount = 0 }) {
      return {
        title: title || 'Flowing Menu',
        subtitle: `${projectCount} project${projectCount === 1 ? '' : 's'}`
      };
    }
  }
}); 