import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'contact',
  title: 'Contact Page',
  type: 'document',
  singleton: true,
  fieldsets: [
    {
      name: 'intro',
      title: 'Page Introduction'
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
        }
      ],
      validation: Rule => Rule.max(1)
    })
  ],
  preview: {
    select: {
      title: 'title'
    },
    prepare: () => ({
      title: 'Contact Page',
      subtitle: 'Contact form and information'
    })
  }
}); 