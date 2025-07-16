// src/app/barber-dashboard/page.tsx
// This is the new main dashboard page for daily appointments overview

import { client, urlFor } from '@/lib/sanity';
import { groq } from 'next-sanity';
import BarberDailyAppointmentsClient from '@/components/BarberDailyAppointmentsClient';
import { Metadata } from 'next';

// Define interfaces for data fetched by this server component
// Re-using interfaces from the manage page for consistency
// Ensure the 'Service' interface is imported from manage/page.tsx
import type { Barber, Appointment, Service, Customer } from '@/app/barber-dashboard/manage/page';

// NEW: Define interface for Contact messages
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
  title: 'Today\'s & Upcoming Appointments - Barber Dashboard', // Updated title
  description: 'Overview of all appointments for today and upcoming days across all barbers.',
};

export const revalidate = 60;

// Function to fetch all barbers and today's appointments
async function getDailyAppointmentsData(): Promise<{
  barbers: Barber[];
  services: Service[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  allAppointments: Appointment[]; // ADDED: New type for all appointments
  contacts: Contact[];
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow (used to filter "today")

  const query = groq`
    {
      "barbers": *[_type == "barber"]{
        _id,
        name,
        slug,
        image,
        bio, // Include bio for BarberProfileModal
        dailyAvailability[] {
          _key,
          dayOfWeek,
          startTime,
          endTime
        }
      },
      "services": *[_type == "service"]{
        _id,
        name,
        slug,
        description,
        image,
        duration,
        price,
        category->{_id, title},
        barbers[]->{_id, name}
      },
      "todayAppointments": *[_type == "appointment" && dateTime >= $startOfDay && dateTime < $endOfDay]{
        _id,
        customer->{_id, name, email, phone}, // Fetch customer details needed for display
        barber->{_id, name},
        service->{_id, name, duration, price}, // Fetch service details needed for display
        dateTime,
        status,
        notes
      } | order(dateTime asc),
      "upcomingAppointments": *[_type == "appointment" && dateTime >= $endOfDay]{
        _id,
        customer->{_id, name, email, phone},
        barber->{_id, name},
        service->{_id, name, duration, price},
        dateTime,
        status,
        notes
      } | order(dateTime asc),
      "allAppointments": *[_type == "appointment"]{ // ADDED: New query for ALL appointments
        _id,
        customer->{_id, name, email, phone},
        barber->{_id, name},
        service->{_id, name, duration, price},
        dateTime,
        status,
        notes
      } | order(dateTime desc), // You might want to order all appointments for display
      "contacts": *[_type == "contact"]{
        _id,
        name,
        email,
        phone,
        subject,
        message,
        sentAt,
        status,
        resolutionNotes
      } | order(sentAt desc)
    }
  `;

  const data = await client.fetch(query, {
    startOfDay: today.toISOString(),
    endOfDay: tomorrow.toISOString(),
  });

  // Process barber images for client component
  const processedBarbers = data.barbers.map((barber: Barber) => ({
    ...barber,
    imageUrl: barber.image ? urlFor(barber.image).url() : undefined,
  }));

  return {
    barbers: processedBarbers || [],
    services: data.services || [],
    todayAppointments: data.todayAppointments || [],
    upcomingAppointments: data.upcomingAppointments || [],
    allAppointments: data.allAppointments || [], // ADDED: Return all appointments
    contacts: data.contacts || [],
  };
}

export default async function BarberDashboardAppointmentsPage() {
  const { barbers, services, todayAppointments, upcomingAppointments, allAppointments, contacts } = await getDailyAppointmentsData(); // MODIFIED: Destructure allAppointments

  return (
    <BarberDailyAppointmentsClient
      barbers={barbers}
      services={services}
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments}
      allAppointments={allAppointments} // ADDED: Pass allAppointments as a prop
    />
  );
}