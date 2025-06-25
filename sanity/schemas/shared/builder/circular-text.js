import { defineField, defineType } from 'sanity';
import { CircleIcon } from '@sanity/icons';

export default defineType({
  name: 'circularText',
  title: 'Circular Text',
  type: 'object',
  icon: CircleIcon,
  fields: [
    defineField({
      name: 'circularText',
      title: 'Circular Text',
      type: 'string',
      description: 'Text that will be displayed in a circle',
      validation: Rule => Rule.required().max(50)
    }),
    defineField({
      name: 'centerImage',
      title: 'Center Image',
      type: 'image',
      description: 'Optional image to display in the center of the circle',
      options: { hotspot: true }
    }),
    defineField({
      name: 'centerText',
      title: 'Center Text',
      type: 'string',
      description: 'Optional text to display in the center (if no image is provided)'
    }),
    defineField({
      name: 'rotationSpeed',
      title: 'Rotation Speed (seconds)',
      type: 'number',
      description: 'Time in seconds for a full rotation',
      initialValue: 20,
      validation: Rule => Rule.min(1).max(60)
    }),
    defineField({
      name: 'direction',
      title: 'Rotation Direction',
      type: 'number',
      options: {
        list: [
          { title: 'Clockwise', value: 1 },
          { title: 'Counter-clockwise', value: -1 }
        ]
      },
      initialValue: 1
    }),
    defineField({
      name: 'fontSize',
      title: 'Font Size (% of radius)',
      type: 'number',
      description: 'Font size as percentage of circle radius',
      initialValue: 1.5,
      validation: Rule => Rule.min(0.5).max(5)
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      description: 'Color of the circular text',
      initialValue: '#000000'
    })
  ],
  preview: {
    select: {
      text: 'circularText',
      media: 'centerImage'
    },
    prepare({ text, media }) {
      return {
        title: text || 'Circular Text',
        subtitle: 'Animated rotating text',
        media: media || CircleIcon
      };
    }
  }
}); 