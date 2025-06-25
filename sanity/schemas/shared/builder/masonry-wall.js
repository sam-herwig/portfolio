import { defineField, defineType } from 'sanity';
import { ImagesIcon } from '@sanity/icons';

export default defineType({
  name: 'masonryWall',
  title: 'Masonry Wall',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title for the masonry wall section'
    }),
    defineField({
      name: 'items',
      title: 'Masonry Items',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Image Item',
          name: 'imageItem',
          fields: [
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              initialValue: 'image',
              readOnly: true,
              hidden: true
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {
                hotspot: true
              }
            }),
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              description: 'Alternative text for accessibility'
            }),
            defineField({
              name: 'aspectRatio',
              title: 'Custom Aspect Ratio',
              type: 'string',
              description: 'Optional custom aspect ratio (e.g., "16/9", "4/3", "1/1")',
              options: {
                list: [
                  { title: 'Landscape (16:9)', value: '16/9' },
                  { title: 'Landscape (4:3)', value: '4/3' },
                  { title: 'Square (1:1)', value: '1/1' },
                  { title: 'Portrait (3:4)', value: '3/4' },
                  { title: 'Portrait (9:16)', value: '9/16' }
                ]
              }
            })
          ],
          preview: {
            select: {
              media: 'image',
              title: 'alt'
            },
            prepare({ media, title }) {
              return {
                media,
                title: title || 'Image Item',
                subtitle: 'Image'
              };
            }
          }
        },
        {
          type: 'object',
          title: 'Video Item',
          name: 'videoItem',
          fields: [
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              initialValue: 'video',
              readOnly: true,
              hidden: true
            }),
            defineField({
              name: 'video',
              title: 'Video File',
              type: 'file',
              options: {
                accept: 'video/*'
              }
            }),
            defineField({
              name: 'poster',
              title: 'Poster Image',
              type: 'image',
              description: 'Image to show before the video plays'
            }),
            defineField({
              name: 'autoplay',
              title: 'Autoplay',
              type: 'boolean',
              initialValue: true
            }),
            defineField({
              name: 'loop',
              title: 'Loop',
              type: 'boolean',
              initialValue: true
            }),
            defineField({
              name: 'muted',
              title: 'Muted',
              type: 'boolean',
              initialValue: true
            }),
            defineField({
              name: 'aspectRatio',
              title: 'Custom Aspect Ratio',
              type: 'string',
              description: 'Optional custom aspect ratio (e.g., "16/9", "4/3", "1/1")',
              options: {
                list: [
                  { title: 'Landscape (16:9)', value: '16/9' },
                  { title: 'Landscape (4:3)', value: '4/3' },
                  { title: 'Square (1:1)', value: '1/1' },
                  { title: 'Portrait (3:4)', value: '3/4' },
                  { title: 'Portrait (9:16)', value: '9/16' }
                ]
              }
            })
          ],
          preview: {
            select: {
              media: 'poster',
              title: 'video.originalFilename'
            },
            prepare({ media, title }) {
              return {
                media,
                title: title || 'Video Item',
                subtitle: 'Video'
              };
            }
          }
        }
      ]
    }),
    defineField({
      name: 'columnWidth',
      title: 'Column Width (px)',
      type: 'number',
      description: 'Width of each masonry column in pixels',
      initialValue: 300,
      validation: Rule => Rule.min(100).max(600)
    }),
    defineField({
      name: 'gapSize',
      title: 'Gap Size (px)',
      type: 'number',
      description: 'Size of the gap between items in pixels',
      initialValue: 20,
      validation: Rule => Rule.min(0).max(100)
    })
  ],
  preview: {
    select: {
      title: 'title',
      itemCount: 'items.length'
    },
    prepare({ title, itemCount = 0 }) {
      return {
        title: title || 'Masonry Wall',
        subtitle: `${itemCount} item${itemCount === 1 ? '' : 's'}`
      };
    }
  }
}); 