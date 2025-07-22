import { defineField, defineType } from 'sanity';
import { ProjectsIcon } from '@sanity/icons';

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ProjectsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string'
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string'
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'link',
      title: 'Project Link',
      type: 'url'
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        { type: 'textBlock' },
        { type: 'pullQuote' },
        { type: 'singleImage' },
        { type: 'heroExplosion' },
        { type: 'heroText' },
        { type: 'generalBlock' },
        { type: 'carousel' },
        { type: 'masonryWall' },
        { type: 'circularText' }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      client: 'client',
      media: 'featuredImage'
    },
    prepare(selection) {
      const { title, client } = selection;
      return {
        title: title,
        subtitle: client ? `Client: ${client}` : '',
        media: selection.media
      }
    }
  }
});