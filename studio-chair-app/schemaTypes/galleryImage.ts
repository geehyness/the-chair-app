// studio/schemas/galleryImage.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: rule => rule.required(),
      description: 'The image to be displayed in the gallery.',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'A short description or caption for the image.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags', // Display as tags in the Studio
      },
      description: 'Keywords to categorize the image (e.g., "haircut", "beard", "interior").',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Set to true if this image should be prominently displayed (e.g., on homepage).',
    }),
  ],
  preview: {
    select: {
      title: 'caption',
      subtitle: 'tags',
      media: 'image',
      featured: 'featured',
    },
    prepare(selection) {
      const {title, subtitle, media, featured} = selection
      const tags = subtitle ? subtitle.join(', ') : 'No tags';
      return {
        title: title || 'Untitled Gallery Image',
        subtitle: `Tags: ${tags} ${featured ? ' (Featured)' : ''}`,
        media: media,
      }
    },
  },
})
