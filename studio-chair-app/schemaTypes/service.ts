// studio/schemas/service.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Name of the service (e.g., "Fade", "Box Braids", "Beard Trim").',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
      description: 'Unique identifier for URL paths.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A brief description of the service.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'A representative image for this service.',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      validation: (rule) => rule.required().min(1),
      description: 'Estimated duration of the service in minutes.',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (rule) => rule.required().min(0),
      description: 'Cost of the service.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      description: 'Category this service belongs to.',
    }),
    defineField({
      name: 'barbers',
      title: 'Available Barbers',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'barber'}]}],
      description: 'Select which barbers can perform this service.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'duration',
      media: 'image',
    },
    prepare(selection) {
      const {title, subtitle, media} = selection
      return {
        title: title,
        subtitle: subtitle ? `${subtitle} minutes` : '',
        media,
      }
    },
  },
})
