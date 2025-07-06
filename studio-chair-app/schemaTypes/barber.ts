// studio/schemas/barber.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'barber',
  title: 'Barber',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Full name of the barber.',
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
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true, // Allows for cropping focus
      },
      description: 'Profile picture of the barber.',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [{title: 'Strong', value: 'strong'}, {title: 'Emphasis', value: 'em'}],
          },
        },
      ],
      description: 'A short description or biography of the barber.',
    }),
    defineField({
      name: 'dailyAvailability',
      title: 'Daily Availability',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'timeBlock', // Name for the embedded object
          title: 'Time Block',
          fields: [
            defineField({
              name: 'dayOfWeek',
              title: 'Day of Week',
              type: 'string',
              options: {
                list: [
                  {title: 'Monday', value: 'monday'},
                  {title: 'Tuesday', value: 'tuesday'},
                  {title: 'Wednesday', value: 'wednesday'},
                  {title: 'Thursday', value: 'thursday'},
                  {title: 'Friday', value: 'friday'},
                  {title: 'Saturday', value: 'saturday'},
                  {title: 'Sunday', value: 'sunday'},
                ],
                layout: 'dropdown',
              },
              validation: (rule) => rule.required(),
              description: 'The day of the week for this availability block.',
            }),
            defineField({
              name: 'startTime',
              title: 'Start Time',
              type: 'string',
              description: 'Start time for this block (e.g., "09:00").',
              validation: (rule) => rule.required().regex(/^\d{2}:\d{2}$/, {name: 'time', invert: false}).error('Must be in HH:mm format (e.g., 09:00).'),
            }),
            defineField({
              name: 'endTime',
              title: 'End Time',
              type: 'string',
              description: 'End time for this block (e.g., "17:00").',
              validation: (rule) => rule.required().regex(/^\d{2}:\d{2}$/, {name: 'time', invert: false}).error('Must be in HH:mm format (e.g., 17:00).'),
            }),
          ],
          preview: {
            select: {
              day: 'dayOfWeek',
              start: 'startTime',
              end: 'endTime',
            },
            prepare(selection) {
              const {day, start, end} = selection;
              return {
                title: `${day.charAt(0).toUpperCase() + day.slice(1)}: ${start} - ${end}`,
              };
            },
          },
        },
      ],
      description: 'Define recurring availability blocks for each day of the week. Add multiple blocks for breaks (e.g., 9:00-12:00, 13:00-17:00).',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
})
