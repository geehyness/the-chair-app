// src/app/api/appointments/route.ts
import { client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic'; // Ensure this route is dynamic

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date'); // YYYY-MM-DD format

    if (!barberId || !date) {
      await logSanityInteraction('error', 'Missing barberId or date for fetching appointments.', 'appointment', undefined, 'system', false, { query: req.url });
      return NextResponse.json({ message: 'Barber ID and Date are required.' }, { status: 400 });
    }

    // Parse the date and get start/end of day for the query
    const parsedDate = parseISO(date);
    const startOfDayISO = startOfDay(parsedDate).toISOString();
    const endOfDayISO = endOfDay(parsedDate).toISOString();

    const query = groq`
      *[_type == "appointment" && barber._ref == $barberId && dateTime >= $startOfDay && dateTime <= $endOfDay] {
        _id,
        dateTime,
        service->{_id, name, duration, price} // Fetch service duration for time slot calculation
      } | order(dateTime asc)
    `;

    const appointments = await client.fetch(query, {
      barberId,
      startOfDay: startOfDayISO,
      endOfDay: endOfDayISO,
    });

    await logSanityInteraction('fetch', `Fetched ${appointments.length} appointments for barber ${barberId} on ${date}.`, 'appointment', undefined, 'system', true, { query: req.url, resultCount: appointments.length });

    return NextResponse.json(appointments, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    let errorMessage = 'Failed to fetch appointments.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to fetch appointments: ${errorMessage}`, 'appointment', undefined, 'system', false, { errorDetails: errorMessage, query: req.url });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
