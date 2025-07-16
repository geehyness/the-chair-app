// src/app/barber-dashboard/admin-reports/page.tsx
import { client, urlFor } from '@/lib/sanity';
import { groq } from 'next-sanity';
import { Metadata } from 'next';

// Import the new Client Component wrapper
import AdminReportsWrapper from '@/components/AdminReportsWrapper';

// Re-use interfaces from the manage page for consistency
import type { Barber, Appointment, Service } from '@/app/barber-dashboard/manage/page';

export const metadata: Metadata = {
  title: 'Admin Reports - Barber Dashboard',
  description: 'Detailed analytics and reports for the barber application.',
};

export const revalidate = 60;

// Function to fetch all data needed for analytics
async function getAnalyticsData(): Promise<{
  barbers: Barber[];
  services: Service[];
  allAppointments: Appointment[];
}> {
  const query = groq`
    {
      "barbers": *[_type == "barber"]{
        _id,
        name,
        slug,
        image
      } | order(name asc),
      "services": *[_type == "service"]{
        _id,
        name,
        price
      } | order(name asc),
      "allAppointments": *[_type == "appointment"]{ // Fetch ALL appointments for comprehensive analytics
        _id,
        customer->{_id, name, email},
        barber->{_id, name},
        service->{_id, name, duration, price},
        dateTime,
        status,
        notes
      } | order(dateTime asc)
    }
  `;

  const data = await client.fetch(query);

  // Process barber images for client component
  const processedBarbers = data.barbers.map((barber: Barber) => ({
    ...barber,
    imageUrl: barber.image ? urlFor(barber.image).url() : undefined,
  }));

  return {
    barbers: processedBarbers || [],
    services: data.services || [],
    allAppointments: data.allAppointments || [],
  };
}

export default async function AdminReportsPage() {
  const { barbers, services, allAppointments } = await getAnalyticsData();

  return (
    <AdminReportsWrapper
      barbers={barbers}
      services={services}
      allAppointments={allAppointments}
    />
  );
}