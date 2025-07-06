// the-chair-app/app/api/book-appointment/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
// import { logger } from '@/lib/logger'; // Application logger
import { logSanityInteraction } from '@/lib/sanityLogger'; // NEW: Sanity Interaction Logger
import { groq } from 'next-sanity';

export async function POST(req: Request) {
  const startTime = process.hrtime.bigint(); // Start timing
  let appointmentId = 'N/A';
  let operationMessage = '';
  let success = false;
  let errorDetails: any = null;
  let customerId = 'N/A'; // Declare customerId here for logging in finally block

  try {
    const requestBody = await req.json(); // Read body once
    customerId = requestBody.customerId; // Assign customerId
    const { barberId, serviceId, dateTime, notes } = requestBody;

    // Basic server-side validation
    if (!customerId || !barberId || !serviceId || !dateTime) {
      // logger.warn('Book Appointment API: Missing required fields.', { customerId, barberId, serviceId, dateTime });
      operationMessage = 'Missing required fields for appointment booking.';
      return NextResponse.json({ message: 'Missing required fields for appointment booking.' }, { status: 400 });
    }

    // Use a Sanity client with a token for write operations
    const clientWithToken = client.withConfig({
      token: process.env.SANITY_API_TOKEN,
      useCdn: false,
    });

    // --- Collision Detection Logic ---
    const service = await clientWithToken.fetch(groq`*[_id == $serviceId][0]{duration}`, { serviceId });
    if (!service) {
      // logger.warn('Book Appointment API: Service not found.', { serviceId });
      operationMessage = 'Selected service not found.';
      return NextResponse.json({ message: 'Selected service not found.' }, { status: 400 });
    }
    const serviceDuration = service.duration;

    const requestedStartTime = new Date(dateTime);
    const requestedEndTime = new Date(requestedStartTime.getTime() + serviceDuration * 60 * 1000);

    // logger.debug('Book Appointment API: Checking for overlapping appointments.', { barberId, requestedStartTime: requestedStartTime.toISOString(), requestedEndTime: requestedEndTime.toISOString() });

    const overlappingAppointments = await clientWithToken.fetch(
      groq`*[_type == "appointment" &&
            barber._ref == $barberId &&
            status != "cancelled" && status != "completed" &&
            dateTime < $requestedEndTime &&
            dateTime + service->duration * 60 * 1000 > $requestedStartTime
           ]`,
      {
        barberId,
        requestedStartTime: requestedStartTime.toISOString(),
        requestedEndTime: requestedEndTime.toISOString(),
      }
    );

    if (overlappingAppointments.length > 0) {
      // logger.warn('Book Appointment API: Appointment slot is already taken.', { barberId, dateTime, overlappingAppointments });
      operationMessage = 'Appointment slot is already taken.';
      return NextResponse.json({ message: 'This appointment slot is already taken. Please choose another time.' }, { status: 409 });
    }

    const barber = await clientWithToken.fetch(groq`*[_id == $barberId][0]{dailyAvailability}`, { barberId });
    if (!barber || !barber.dailyAvailability) {
      // logger.warn('Book Appointment API: Barber or their availability not found.', { barberId });
      operationMessage = 'Barber availability could not be verified.';
      return NextResponse.json({ message: 'Barber availability could not be verified.' }, { status: 400 });
    }

    const dayOfWeek = requestedStartTime.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const isWithinAvailability = barber.dailyAvailability.some((block: any) => {
      if (block.dayOfWeek !== dayOfWeek) return false;

      const [blockStartHour, blockStartMinute] = block.startTime.split(':').map(Number);
      const [blockEndHour, blockEndMinute] = block.endTime.split(':').map(Number);

      const blockStartTime = new Date(requestedStartTime);
      blockStartTime.setHours(blockStartHour, blockStartMinute, 0, 0);

      const blockEndTime = new Date(requestedStartTime);
      blockEndTime.setHours(blockEndHour, blockEndMinute, 0, 0);

      return requestedStartTime.getTime() >= blockStartTime.getTime() &&
             requestedEndTime.getTime() <= blockEndTime.getTime();
    });

    if (!isWithinAvailability) {
      // logger.warn('Book Appointment API: Requested time outside barber\'s available hours.', { barberId, dateTime, dailyAvailability: barber.dailyAvailability });
      operationMessage = 'Requested time outside barber\'s available hours.';
      return NextResponse.json({ message: 'The selected time is outside the barber\'s working hours for that day.' }, { status: 400 });
    }
    // --- End Collision Detection Logic ---

    // Create the new appointment document
    const newAppointment = {
      _type: 'appointment',
      customer: { _ref: customerId, _type: 'reference' },
      barber: { _ref: barberId, _type: 'reference' },
      service: { _ref: serviceId, _type: 'reference' },
      dateTime: requestedStartTime.toISOString(),
      status: 'pending',
      notes: notes || '',
      log: [],
    };

    // logger.info('Book Appointment API: Attempting to create new appointment in Sanity.', { customerId, barberId, serviceId, dateTime });
    const createdAppointment = await clientWithToken.create(newAppointment);
    appointmentId = createdAppointment._id; // Assign the new appointment ID
    // logger.info('Book Appointment API: New appointment created successfully.', { appointmentId });

    // Add an initial log entry to the newly created appointment document
    const logEntry = {
      _type: 'logEntry',
      timestamp: new Date().toISOString(),
      type: 'creation',
      message: 'Appointment created by customer via web form.',
      user: customerId,
      details: {
        initialStatus: 'pending',
        bookedDateTime: new Date(dateTime).toLocaleString(),
        barber: barberId,
        service: serviceId,
      },
    };

    // logger.debug('Book Appointment API: Adding initial log entry to appointment.', { appointmentId });
    await clientWithToken
      .patch(createdAppointment._id)
      .setIfMissing({ log: [] })
      .insert('after', 'log[-1]', [logEntry])
      .commit();
    // logger.info('Book Appointment API: Appointment log updated with creation entry.', { appointmentId });

    operationMessage = `Appointment booked successfully for customer ${customerId} with barber ${barberId}.`;
    success = true;
    return NextResponse.json({ message: 'Appointment booked successfully!', appointment: createdAppointment }, { status: 201 });
  } catch (error: any) {
    // logger.error('Book Appointment API: Error booking appointment:', { message: error.message, stack: error.stack, requestBody: req.json().catch(() => {}) });
    operationMessage = `Error booking appointment: ${error.message}`;
    success = false;
    errorDetails = { message: error.message, stack: error.stack };
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  } finally {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    // Log the interaction to Sanity
    await logSanityInteraction(
      'bookingAttempt', // Specific operation type for this API
      operationMessage,
      'appointment',
      appointmentId,
      customerId, // Use customerId as the user for this log
      success,
      {
        payload: req.json().catch(() => {}), // Log the request payload
        errorDetails,
        durationMs,
      }
    );
  }
}
