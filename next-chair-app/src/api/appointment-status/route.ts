// the-chair-app/app/api/appointment-status/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
// import { logger } from '@/lib/logger'; // Application logger
import { logSanityInteraction } from '@/lib/sanityLogger'; // NEW: Sanity Interaction Logger
import { groq } from 'next-sanity';

export async function POST(req: Request) {
  const startTime = process.hrtime.bigint(); // Start timing
  let operationMessage = '';
  let success = false;
  let errorDetails: any = null;
  let appointmentId = 'N/A';
  let barberId = 'N/A'; // Declare barberId here for logging in finally block

  try {
    const requestBody = await req.json(); // Read body once
    appointmentId = requestBody.appointmentId; // Assign appointmentId
    barberId = requestBody.barberId; // Assign barberId
    const { newStatus } = requestBody;

    // Basic validation
    if (!appointmentId || !newStatus) {
      // logger.warn('Appointment Status API: Missing required fields (appointmentId or newStatus).', { appointmentId, newStatus });
      operationMessage = 'Missing required fields for status update.';
      return NextResponse.json({ message: 'Appointment ID and new status are required.' }, { status: 400 });
    }

    // Define valid statuses
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(newStatus)) {
      // logger.warn('Appointment Status API: Invalid status provided.', { appointmentId, newStatus });
      operationMessage = 'Invalid status provided.';
      return NextResponse.json({ message: 'Invalid status provided.' }, { status: 400 });
    }

    // Use a Sanity client with a token for write operations
    const clientWithToken = client.withConfig({
      token: process.env.SANITY_API_TOKEN,
      useCdn: false,
    });

    // Fetch the current appointment to get its current status and log history
    // logger.debug(`Appointment Status API: Fetching current appointment ${appointmentId} for status update.`);
    const currentAppointment = await clientWithToken.fetch(
      groq`*[_id == $appointmentId][0]{status, log}`,
      { appointmentId }
    );

    if (!currentAppointment) {
      // logger.warn(`Appointment Status API: Appointment not found with ID: ${appointmentId}`);
      operationMessage = 'Appointment not found.';
      return NextResponse.json({ message: 'Appointment not found.' }, { status: 404 });
    }

    const oldStatus = currentAppointment.status;

    // Prepare the log entry for the appointment's embedded log
    const embeddedLogEntry = {
      _type: 'logEntry',
      timestamp: new Date().toISOString(),
      type: 'update',
      message: `Status changed from '${oldStatus}' to '${newStatus}'.`,
      user: barberId || 'Admin/System',
      details: {
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedBy: barberId,
      },
    };

    // logger.info(`Appointment Status API: Attempting to update status for appointment ${appointmentId} to ${newStatus}.`);
    const updatedAppointment = await clientWithToken
      .patch(appointmentId)
      .set({ status: newStatus })
      .setIfMissing({ log: [] })
      .insert('after', 'log[-1]', [embeddedLogEntry])
      .commit();

    // logger.info(`Appointment Status API: Status for appointment ${appointmentId} successfully updated to ${newStatus}. Log entry added.`);
    operationMessage = `Appointment status changed from '${oldStatus}' to '${newStatus}'.`;
    success = true;
    return NextResponse.json({ message: 'Appointment status updated successfully!', appointment: updatedAppointment }, { status: 200 });
  } catch (error: any) {
    // logger.error('Appointment Status API: Error updating appointment status:', { message: error.message, stack: error.stack, requestBody: req.json().catch(() => {}) });
    operationMessage = `Error updating appointment status: ${error.message}`;
    success = false;
    errorDetails = { message: error.message, stack: error.stack };
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  } finally {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    // Log the interaction to Sanity
    await logSanityInteraction(
      'statusChange', // Specific operation type for this API
      operationMessage,
      'appointment',
      appointmentId,
      barberId, // Use barberId as the user for this log
      success,
      {
        payload: req.json().catch(() => {}), // Log the request payload
        errorDetails,
        durationMs,
      }
    );
  }
}
