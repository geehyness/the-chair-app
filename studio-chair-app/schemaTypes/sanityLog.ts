// studio/schemas/sanityLog.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'sanityLog',
  title: 'Sanity Interaction Log',
  type: 'document',
  fields: [
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
      description: 'The exact time when this interaction was logged.',
    }),
    defineField({
      name: 'operationType',
      title: 'Operation Type',
      type: 'string',
      options: {
        list: [
          {title: 'Create Document', value: 'create'},
          {title: 'Update Document', value: 'update'},
          {title: 'Delete Document', value: 'delete'},
          {title: 'Fetch Document(s)', value: 'fetch'},
          {title: 'Customer Lookup', value: 'customerLookup'},
          {title: 'Booking Attempt', value: 'bookingAttempt'},
          {title: 'Status Change', value: 'statusChange'},
          {title: 'Error', value: 'error'},
          {title: 'System Event', value: 'system'},
        ],
        layout: 'dropdown',
      },
      validation: (rule) => rule.required(),
      description: 'Type of operation performed (e.g., create, update, fetch).',
    }),
    defineField({
      name: 'documentType',
      title: 'Document Type Affected',
      type: 'string',
      description: 'The Sanity document type involved (e.g., "appointment", "barber", "customer").',
    }),
    defineField({
      name: 'documentId',
      title: 'Document ID Affected',
      type: 'string',
      description: 'The _id of the Sanity document involved, if applicable.',
    }),
    defineField({
      name: 'userId',
      title: 'User/Actor ID',
      type: 'string',
      description: 'The ID of the user or system component that initiated the action (e.g., customer ID, barber ID).',
    }),
    defineField({
      name: 'message',
      title: 'Summary Message',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'A brief summary of the interaction.',
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'object',
      fields: [
        {name: 'payload', title: 'Payload/Input', type: 'json'}, // Store raw input/output if useful
        {name: 'oldValue', title: 'Old Value (JSON)', type: 'json'},
        {name: 'newValue', title: 'New Value (JSON)', type: 'json'},
        {name: 'query', title: 'GROQ Query (if fetch)', type: 'text'},
        {name: 'errorDetails', title: 'Error Details', type: 'json'},
        {name: 'durationMs', title: 'Duration (ms)', type: 'number'}, // How long the operation took
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
      description: 'Detailed JSON data related to the interaction.',
    }),
    defineField({
      name: 'success',
      title: 'Success',
      type: 'boolean',
      initialValue: true,
      description: 'Indicates if the operation was successful.',
    }),
  ],
  readOnly: true, // Logs should not be manually editable in the Studio
  preview: {
    select: {
      title: 'message',
      subtitle: 'operationType',
      media: 'timestamp',
      success: 'success',
    },
    prepare(selection) {
      const {title, subtitle, media, success} = selection;
      const date = media ? new Date(media).toLocaleString() : 'N/A';
      const statusIcon = success ? '✅' : '❌';
      return {
        title: `${statusIcon} ${title}`,
        subtitle: `${date} - Type: ${subtitle || 'N/A'}`,
      };
    },
  },
})
