import { defineField, defineType } from 'sanity';
import { CogIcon } from '@sanity/icons';
// Sanity Icon Set: https://icons.sanity.build/all

export default defineType({
  name: 'site',
  title: 'Site',
  type: 'document',
  singleton: true,
  icon: CogIcon,
  fieldsets: [
    {
      name: 'header',
      title: 'Header'
    },
    {
      name: 'footer',
      title: 'Footer'
    },
    {
      name: 'contact',
      title: 'Contact'
    },
    {
      name: 'socials',
      title: 'Socials'
    },
    {
      name: 'legal',
      title: 'Legal Stuff'
    }
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      hidden: true
    }),
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'header',
      name: 'headerTitle',
      title: 'Title',
      type: 'text',
      rows: 2,
      validation: [
        Rule => Rule.required()
      ],
      description: 'The first line will be in bold'
    }),
    defineField({
      fieldset: 'footer',
      name: 'footerTitle',
      title: 'Title',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'footer',
      name: 'generalLabel',
      title: 'General Label',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'footer',
      name: 'businessLabel',
      title: 'Business Label',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'contact',
      name: 'generalEmail',
      title: 'General Email',
      type: 'string',
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'contact',
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 2,
      validation: [
        Rule => Rule.required()
      ]
    }),
    defineField({
      fieldset: 'contact',
      name: 'addressLink',
      title: 'Address Link',
      type: 'url',
      validation: [
        Rule => Rule.required()
      ]
    })
  ]
});
