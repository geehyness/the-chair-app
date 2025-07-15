// src/app/barber-dashboard/messages/page.tsx
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';
import BarberMessagesClient from '@/components/BarberMessagesClient';
import { Metadata } from 'next';

// Define the Contact interface, matching the schema in Sanity
export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'new' | 'inProgress' | 'resolved' | 'spam';
  resolutionNotes?: string;
}

export const metadata: Metadata = {
  title: 'Customer Messages - Barber Dashboard',
  description: 'Manage customer contact messages for The Chair App barbershop.',
};

async function getContactMessages(): Promise<Contact[]> {
  const query = groq`
    *[_type == "contact"] | order(sentAt desc) {
      _id,
      name,
      email,
      phone,
      subject,
      message,
      sentAt,
      status,
      resolutionNotes,
    }
  `;
  const data = await client.fetch(query);
  return data;
}

export default async function CustomerMessagesPage() {
  const contacts = await getContactMessages();

  return (
    <BarberMessagesClient initialContacts={contacts} />
  );
}
