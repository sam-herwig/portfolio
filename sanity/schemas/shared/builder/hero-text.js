import { defineType, defineField } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons';

export default defineType({
  name: 'heroText',
  title: 'Hero Text',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Main title text with animated pressure effect',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Optional subtitle text with animated pressure effect'
    }),
    defineField({
      name: 'circularText',
      title: 'Circular Text',
      type: 'string',
      description: 'Text that will rotate in a circle',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'centerText',
      title: 'Center Text',
      type: 'string',
      description: 'Text to display in the center of the circular text (optional)'
    }),
    defineField({
      name: 'centerImage',
      title: 'Center Image',
      type: 'image',
      description: 'Image to display in the center of the circular text (optional)',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'url',
      description: 'URL for the call-to-action button'
    }),
    defineField({
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
      description: 'Text for the call-to-action button',
      initialValue: 'Learn More'
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Background color for the hero section',
      initialValue: '#e94234',
      options: {
        list: [
          { title: 'Red', value: '#e94234' },
          { title: 'Black', value: '#000000' },
          { title: 'White', value: '#ffffff' },
          { title: 'Gold', value: '#FFD700' },
          { title: 'Green', value: '#4CAF50' },
          { title: 'Purple', value: '#9C27B0' }
        ]
      }
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      description: 'Color for the text elements',
      initialValue: '#000000',
      options: {
        list: [
          { title: 'Black', value: '#000000' },
          { title: 'White', value: '#ffffff' },
          { title: 'Red', value: '#e94234' },
          { title: 'Gold', value: '#FFD700' },
          { title: 'Green', value: '#4CAF50' },
          { title: 'Purple', value: '#9C27B0' }
        ]
      }
    }),
    defineField({
      name: 'rotationSpeed',
      title: 'Rotation Speed',
      type: 'number',
      description: 'Speed of the circular text rotation (seconds for a full rotation)',
      initialValue: 20,
      validation: Rule => Rule.min(1).max(60)
    }),
    defineField({
      name: 'direction',
      title: 'Rotation Direction',
      type: 'number',
      description: 'Direction of the circular text rotation',
      initialValue: 1,
      options: {
        list: [
          { title: 'Clockwise', value: 1 },
          { title: 'Counter-clockwise', value: -1 }
        ]
      }
    }),
    defineField({
      name: 'fontSize',
      title: 'Circular Text Font Size',
      type: 'number',
      description: 'Font size for the circular text (as percentage of circle radius)',
      initialValue: 5,
      validation: Rule => Rule.min(1).max(10)
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      circularText: 'circularText',
      media: 'centerImage'
    },
    prepare({ title, subtitle, circularText, media }) {
      return {
        title: title || 'Hero Text',
        subtitle: subtitle ? `${subtitle} - ${circularText || ''}` : (circularText ? `Circular text: ${circularText}` : 'No circular text set'),
        media: media || DocumentTextIcon
      };
    }
  }
}); 