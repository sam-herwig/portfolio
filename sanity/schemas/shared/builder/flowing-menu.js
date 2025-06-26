import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'flowingMenu',
  title: 'Flowing Menu',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Title displayed above the flowing menu'
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Background color of the flowing menu',
      options: {
        list: [
          { title: 'Black', value: 'black' },
          { title: 'Dark Black', value: 'dark-black' },
          { title: 'Red', value: 'red' },
          { title: 'White', value: 'white' }
        ]
      }
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      description: 'Text color of the menu items',
      options: {
        list: [
          { title: 'Black', value: 'black' },
          { title: 'White', value: 'white' },
          { title: 'Red', value: 'red' }
        ]
      }
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
      title: 'Enable Tags',
      type: 'boolean',
      description: 'Enable filtering by tags',
      initialValue: true
    }),
    defineField({
      name: 'height',
      title: 'Menu Height',
      type: 'string',
      description: 'Height of the menu (e.g., 70vh, 500px)',
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
        subtitle: `Projects menu with ${projectCount} items`
      };
    }
  }
}); 