// studio/schemas/testimonial.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'customerName', title: 'Customer Name', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', validation: rule => rule.required() }),
    defineField({ name: 'rating', title: 'Rating', type: 'number', validation: rule => rule.min(1).max(5), description: '1–5 star rating' }),
    defineField({ name: 'date', title: 'Date', type: 'datetime' }),
    defineField({ name: 'image', title: 'Image (Optional)', type: 'image', options: { hotspot: true } }),
  ],
})
