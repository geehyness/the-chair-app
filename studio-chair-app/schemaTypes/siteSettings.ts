// studio/schemas/siteSettings.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // This document should ideally be a singleton, meaning only one instance exists.
  // You might enforce this in your Sanity Studio desk structure.
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      description: 'The main title for your website (e.g., "The Chair App Barbershop").',
    }),
    defineField({
      name: 'description',
      title: 'Tagline / Description',
      type: 'text',
      rows: 3,
      description: 'A short description or tagline for your website, used in SEO.',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'The main logo for your website.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Homepage Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'The large image displayed on your homepage hero section.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Your contact phone number.',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Your contact email address.',
    }),
    defineField({
      name: 'location',
      title: 'Physical Location',
      type: 'string',
      description: 'Your barbershop\'s physical address.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'socialLink', // Give the object a name for better clarity
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'Twitter', value: 'twitter' },
                  { title: 'LinkedIn', value: 'linkedin' },
                  { title: 'TikTok', value: 'tiktok' },
                ],
              },
              validation: rule => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: rule => rule.required().uri({ allowRelative: false }),
              description: 'The full URL to your social media profile.',
            }),
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'url',
            },
            prepare(selection) {
              const { title, subtitle } = selection;
              return {
                title: title ? `${title.charAt(0).toUpperCase() + title.slice(1)}` : 'Social Link',
                subtitle: subtitle,
              };
            },
          },
        },
      ],
      description: 'Links to your social media profiles.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        title: title || 'Site Settings',
        subtitle: subtitle || 'Global website configuration',
      }
    },
  },
})
