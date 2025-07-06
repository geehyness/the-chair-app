// studio/schemas/appointment.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'appointment',
  title: 'Appointment',
  type: 'document',
  fields: [
    defineField({
      name: 'customer',
      title: 'Customer',
      type: 'reference',
      to: [{type: 'customer'}],
      validation: (rule) => rule.required(),
      description: 'The customer who booked this appointment.',
    }),
    defineField({
      name: 'barber',
      title: 'Barber',
      type: 'reference',
      to: [{type: 'barber'}],
      validation: (rule) => rule.required(),
      description: 'The barber assigned to this appointment.',
    }),
    defineField({
      name: 'service',
      title: 'Service',
      type: 'reference',
      to: [{type: 'service'}],
      validation: (rule) => rule.required(),
      description: 'The service being performed during this appointment.',
    }),
    defineField({
      name: 'dateTime',
      title: 'Date and Time',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        timeStep: 15, // Allow bookings every 15 minutes
        calendarTodayLabel: 'Today',
      },
      validation: (rule) => rule.required(),
      description: 'The scheduled date and time for the appointment.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Confirmed', value: 'confirmed'},
          {title: 'Cancelled', value: 'cancelled'},
          {title: 'Completed', value: 'completed'},
        ],
        layout: 'radio', // Display as radio buttons for clear status
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
      description: 'The current status of the appointment.',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      description: 'Any additional notes or special requests for the appointment.',
    }),
    defineField({
      name: 'log',
      title: 'Activity Log',
      type: 'array',
      of: [{type: 'logEntry'}], // Reference to the embedded logEntry type
      readOnly: true, // Prevent manual editing of the log array in the Studio
      description: 'An immutable log of all significant changes and events related to this appointment.',
    }),
  ],
  preview: {
    select: {
      customerName: 'customer.name',
      barberName: 'barber.name',
      serviceName: 'service.name',
      dateTime: 'dateTime',
      status: 'status',
    },
    prepare(selection) {
      const {customerName, barberName, serviceName, dateTime, status} = selection
      const formattedDateTime = dateTime ? new Date(dateTime).toLocaleString() : 'N/A';
      return {
        title: `${serviceName || 'Service'} for ${customerName || 'Unknown Customer'} with ${barberName || 'Unknown Barber'}`,
        subtitle: `${formattedDateTime} - Status: ${status || 'N/A'}`,
      }
    },
  },
})
