import { defineField, defineType } from 'sanity';
import { ProjectsIcon } from '@sanity/icons';

export default defineType({
  name: 'projectsPage',
  title: 'Projects Page',
  type: 'document',
  singleton: true,
  icon: ProjectsIcon,
  fieldsets: [
    {
      name: 'intro',
      title: 'Page Introduction'
    },
    {
      name: 'content',
      title: 'Page Content'
    }
  ],
  fields: [
    defineField({
      fieldset: 'intro',
      name: 'blocks',
      title: 'Introduction Blocks',
      type: 'array',
      of: [
        {
          type: 'generalBlock'
        },
        {
          type: 'flowingMenu'
        }
      ]
    }),
    defineField({
      fieldset: 'content',
      name: 'projects',
      title: 'Projects',
      type: 'array',
      description: 'Select projects to display on this page',
      validation: Rule => Rule.required().min(1),
      of: [
        {
          type: 'reference',
          to: [{ type: 'project' }]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'projects'
    },
    prepare: ({ title, subtitle }) => ({
      title: 'Projects Page',
      subtitle: subtitle ? `${subtitle.length} projects` : 'No projects selected'
    })
  }
}); 