// studio/schemas/logEntry.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'logEntry',
  title: 'Log Entry',
  type: 'object', // This is an object type, designed to be embedded within other documents (like Appointment)
  fields: [
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      readOnly: true, // Log entries should not be manually editable after creation
      initialValue: () => new Date().toISOString(), // Automatically set current time
      description: 'The exact time when this log entry was created.',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Creation', value: 'creation'},
          {title: 'Update', value: 'update'},
          {title: 'Cancellation', value: 'cancellation'},
          {title: 'Confirmation', value: 'confirmation'},
          {title: 'Error', value: 'error'},
          {title: 'System Event', value: 'system'},
        ],
      },
      description: 'The type of event recorded (e.g., creation, update, error).',
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      description: 'A descriptive message about the log event.',
    }),
    defineField({
      name: 'user',
      title: 'User',
      type: 'string', // Could be a reference to a 'user' document if you implement user authentication
      description: 'The user or system component that triggered this log entry.',
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'object',
      fields: [
        // Example fields for specific details. Adjust as needed.
        {name: 'fieldChanged', title: 'Field Changed', type: 'string'},
        {name: 'oldValue', title: 'Old Value', type: 'string'},
        {name: 'newValue', title: 'New Value', type: 'string'},
        {name: 'errorMessage', title: 'Error Message', type: 'string'},
        {name: 'stackTrace', title: 'Stack Trace', type: 'text'},
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
      description: 'Optional structured data providing more context about the event.',
    }),
  ],
  readOnly: true, // Ensure individual log entries are read-only in the Studio
  preview: {
    select: {
      title: 'message',
      subtitle: 'timestamp',
      media: 'type', // You could use an icon based on type
    },
    prepare(selection) {
      const {title, subtitle, media} = selection;
      const date = subtitle ? new Date(subtitle).toLocaleString() : 'N/A';
      return {
        title: title || 'No message',
        subtitle: `${date} - Type: ${media || 'N/A'}`,
      };
    },
  },
})
