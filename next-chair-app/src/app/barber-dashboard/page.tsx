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

export const metadata: Metadata = {
  title: 'Today\'s & Upcoming Appointments - Barber Dashboard', // Updated title
  description: 'Overview of all appointments for today and upcoming days across all barbers.',
};

// Function to fetch all barbers and today's appointments
async function getDailyAppointmentsData(): Promise<{
  barbers: Barber[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[]; // NEW: Add upcoming appointments
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
        dailyAvailability[] {
          _key,
          dayOfWeek,
          startTime,
          endTime
        }
      } | order(name asc),
      "todayAppointments": *[_type == "appointment" && dateTime < $endOfDay && dateTime >= $startOfDay]{
        _id,
        customer->{_id, name, email},
        barber->{_id, name},
        service->{_id, name, duration, price}, // Fetch service details needed for display
        dateTime,
        status,
        notes
      } | order(dateTime asc),
      "upcomingAppointments": *[_type == "appointment" && dateTime >= $endOfDay]{ // NEW: Appointments from tomorrow onwards
        _id,
        customer->{_id, name, email},
        barber->{_id, name},
        service->{_id, name, duration, price},
        dateTime,
        status,
        notes
      } | order(dateTime asc) // Order upcoming appointments by date/time
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
    todayAppointments: data.todayAppointments || [],
    upcomingAppointments: data.upcomingAppointments || [], // Return upcoming appointments
  };
}

export default async function BarberDashboardAppointmentsPage() {
  const { barbers, todayAppointments, upcomingAppointments } = await getDailyAppointmentsData(); // Destructure upcomingAppointments

  return (
    <BarberDailyAppointmentsClient
      barbers={barbers}
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments} // Pass upcomingAppointments to client component
    />
  );
}