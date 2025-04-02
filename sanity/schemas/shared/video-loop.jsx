import React from 'react';
import { defineField, defineType } from 'sanity';
import { PlayIcon } from '@sanity/icons';

export default defineType({
  name: 'videoLoop',
  title: 'Video Loop / Autoplay',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'vimeo',
      title: 'Vimeo Player',
      type: 'vimeo',
      description: 'This is the numerical ID at the end of the URL (i.e. for https://vimeo.com/475650270 your ID is 475650270). You can change your thumbnail and title at vimeo.com in your video settings.',
      validation: [
        Rule => Rule.required()
      ]
    })
  ],
  preview: {
    select: {
      thumb: 'vimeo.pictures.sizes.[1].link',
      title: 'vimeo.name'
    },
    prepare: ({ thumb, title }) => {
      return {
        media: thumb ? <img src={thumb} alt={title} /> : PlayIcon,
        title: title ? title : 'Please enter a valid Vimeo ID',
        subtitle: 'Video Loop / Autoplay'
      }
    }
  }
});
