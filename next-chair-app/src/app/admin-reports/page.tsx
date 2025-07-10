// src/app/admin-reports/page.tsx
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';
import { logger } from '@/lib/logger'; // <--- ADD THIS LINE to import logger
import { Metadata } from 'next';

// Define TypeScript interfaces for the data types you'll manage
// Re-using interfaces from the manage page for consistency
import type { Appointment, Service, Barber, Customer } from '@/app/barber-dashboard/manage/page';

export const metadata: Metadata = {
  title: 'Admin Reports - The Chair App',
  description: 'View various reports and analytics for The Chair App.',
};

// Function to fetch all necessary data for reports
async function getReportData(): Promise<Appointment[]> {
  try {
    logger.info('Admin Reports: Fetching all relevant appointment data for reports.'); // Now 'logger' is defined
    const query = groq`*[_type == "appointment"]{
      _id,
      dateTime,
      status,
      notes,
      customer->{_id, name, email, phone},
      barber->{_id, name},
      service->{_id, name, duration, price},
      log[]{
        _key,
        timestamp,
        type,
        message,
        user,
        details
      }
    } | order(dateTime desc)`; // Order by most recent appointments first

    const appointments = await client.fetch(query);
    logger.info(`Admin Reports: Fetched ${appointments.length} appointments for reports.`);
    return appointments;
  } catch (error: any) {
    logger.error('Admin Reports: Error fetching report data:', { message: error.message, stack: error.stack });
    return []; // Return empty array on error
  }
}

// Server component to fetch data and pass it to the client component
export default async function AdminReportsPage() {
  const appointments = await getReportData();

  // You would typically pass this data to a client component that renders the charts/tables
  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Reports</h1>
      <p>This page will display various reports based on appointment data.</p>
      <pre>{JSON.stringify(appointments, null, 2)}</pre> {/* For debugging, display raw data */}
      {/* You would replace the pre tag with your actual report components */}
    </div>
  );
}
