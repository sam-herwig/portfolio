import React from 'react';
import { defineField, defineType } from 'sanity';
import { SlugInput } from 'sanity-plugin-prefixed-slug';
import { RocketIcon } from '@sanity/icons';
// Sanity Icon Set: https://icons.sanity.build/all

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: RocketIcon,
  fieldsets: [
    {
      name: 'display',
      title: 'Display Options'
    },
    {
      name: 'content',
      title: 'Content'
    }
  ],
  fields: [
    defineField({
      fieldset: 'content',
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'content',
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      components: {
        input: SlugInput,
      },
      description: 'Press "Generate" to automatically create a slug from the title above.',
      options: {
        source: 'title',
        urlPrefix: '/'
      },
      validation: [
        Rule => Rule.required().custom((slug) => {
          if (typeof slug === "undefined") return true;
          const regex = /(^[a-z0-9-]+$)/;
          if (regex.test(slug.current)) {
            return true;
          } else {
            return 'Invalid slug: Only lowercase letters, numbers, and dashes are allowed.'
          }
        })
      ]
    }),
    defineField({
      fieldset: 'content',
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Short description or tagline for the project',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'content',
      name: 'projectUrl',
      title: 'Live Site URL',
      type: 'url',
      description: 'Link to the live project (shown as "See Site" button)',
    }),
    defineField({
      fieldset: 'content',
      name: 'circularText',
      title: 'Circular Text',
      type: 'string',
      description: 'Text that spins in a circle on the project hero (e.g., "LET\'S GET VOODOO • ")',
    }),
    defineField({
      fieldset: 'content',
      name: 'overview',
      title: 'Project Overview',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Headline',
          type: 'string',
          description: 'Punchy one-liner for the project'
        },
        {
          name: 'richtext',
          title: 'Description',
          type: 'blockContent',
          description: 'Detailed project description'
        }
      ]
    }),
    defineField({
      fieldset: 'display',
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      description: 'Used for gallery and listing modules',
      options: {
        hotspot: true
      },
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'display',
      name: 'titleClass',
      title: 'Title Style',
      type: 'string',
      options: {
        list: [
          { title: 'Default', value: '' },
          { title: 'Red', value: 'red' }
        ],
      },
      initialValue: ''
    }),
    defineField({
      fieldset: 'display',
      name: 'cursorImage',
      title: 'Custom Cursor Image',
      type: 'image',
      description: 'This image will be used as the cursor when hovering over this project (desktop only)',
      options: {
        hotspot: true
      },
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'display',
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Web', value: 'WEB' },
              { title: 'Interactive', value: 'Interactive' },
              { title: 'Three.JS', value: 'Three.JS' },
              { title: 'New Belgium', value: 'New Belgium' },
              { title: 'Fresh Build', value: 'Fresh Build' }
            ]
          }
        }
      ],
      validation: [
        Rule => Rule.required().min(1)
      ]
    }),
    defineField({
      name: 'blocks',
      title: 'Page Builder Blocks',
      type: 'array',
      of: [
        {
          type: 'textBlock'
        },
        {
          type: 'pullQuote'
        },
        {
          type: 'singleImage'
        },
        {
          type: 'heroExplosion'
        },
        {
          type: 'heroText'
        },
        {
          type: 'videoLoop'
        },
        {
          type: 'videoPlayer'
        },
        { type: 'carousel' },
        { type: 'masonryWall' },
        { type: 'circularText' }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'cursorImage'
    }
  }
});
