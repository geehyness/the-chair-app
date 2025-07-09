// studio/schemas/testimonial.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: rule => rule.required(),
      description: 'The name of the customer giving the testimonial.',
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 5,
      validation: rule => rule.required(),
      description: 'The actual testimonial quote from the customer.',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: rule => rule.required().min(1).max(5).integer(),
      description: '1-5 star rating given by the customer.',
      options: {
        list: [
          { title: '1 Star', value: 1 },
          { title: '2 Stars', value: 2 },
          { title: '3 Stars', value: 3 },
          { title: '4 Stars', value: 4 },
          { title: '5 Stars', value: 5 },
        ],
      },
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        calendarTodayLabel: 'Today',
      },
      description: 'The date the testimonial was given or published.',
    }),
    defineField({
      name: 'image',
      title: 'Customer Image (Optional)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'An optional image of the customer.',
    }),
  ],
  preview: {
    select: {
      title: 'customerName',
      subtitle: 'quote',
      media: 'image',
      rating: 'rating',
    },
    prepare(selection) {
      const {title, subtitle, media, rating} = selection
      const stars = '⭐'.repeat(rating || 0); // Display stars based on rating
      return {
        title: `${title} ${stars}`,
        subtitle: subtitle ? `${subtitle.substring(0, 50)}...` : 'No quote provided',
        media: media,
      }
    },
  },
})
