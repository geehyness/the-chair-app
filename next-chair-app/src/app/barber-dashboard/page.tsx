// src/app/barber-dashboard/page.tsx
// This is the new main dashboard page for daily appointments overview

import { client, urlFor } from '@/lib/sanity';
import { groq } from 'next-sanity';
import BarberDailyAppointmentsClient from '@/components/BarberDailyAppointmentsClient';
import { Metadata } from 'next';

// Define interfaces for data fetched by this server component
// Re-using interfaces from the manage page for consistency
import type { Barber, Appointment, Service, Customer } from '@/app/barber-dashboard/manage/page';

export const metadata: Metadata = {
  title: 'Today\'s Appointments - Barber Dashboard',
  description: 'Overview of all appointments for today across all barbers.',
};

// Function to fetch all barbers and today's appointments
async function getDailyAppointmentsData(): Promise<{
  barbers: Barber[];
  todayAppointments: Appointment[];
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

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
      "appointments": *[_type == "appointment" && dateTime >= $startOfDay && dateTime < $endOfDay]{
        _id,
        customer->{_id, name, email},
        barber->{_id, name},
        service->{_id, name, duration, price}, // Fetch service details needed for display
        dateTime,
        status,
        notes
      } | order(dateTime asc)
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
    todayAppointments: data.appointments || [],
  };
}

export default async function BarberDashboardAppointmentsPage() {
  const { barbers, todayAppointments } = await getDailyAppointmentsData();

  return (
    <BarberDailyAppointmentsClient
      barbers={barbers}
      todayAppointments={todayAppointments}
    />
  );
}
