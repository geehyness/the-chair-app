// src/app/api/book-appointment/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { addMinutes, parseISO, isBefore, isAfter, isEqual, format, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';

export const dynamic = 'force-dynamic'; // Ensure this route is dynamic

export async function POST(req: NextRequest) {
  let customerId: string | undefined; // To store existing or new customer ID
  let appointmentData: any; // To store the parsed request body

  try {
    appointmentData = await req.json();
    const { customerName, customerEmail, customerPhone, barberId, serviceId, dateTime, notes, createAccount } = appointmentData; // Destructure createAccount

    // 1. Basic Validation
    if (!customerName || !customerEmail || !customerPhone || !barberId || !serviceId || !dateTime) {
      await logSanityInteraction('error', 'Missing required fields for booking (name, email, phone, barber, service, dateTime).', 'appointment', undefined, 'customer', false, { payload: appointmentData });
      return NextResponse.json({ message: 'Missing required fields (Name, Email, Phone, Barber, Service, Date, Time).' }, { status: 400 });
    }

    const requestedDateTime = parseISO(dateTime);

    // 2. Fetch Service and Barber details to get duration and availability
    const [service, barber] = await Promise.all([
      client.fetch(groq`*[_id == $serviceId][0]{_id, name, duration, price}`, { serviceId }),
      client.fetch(groq`*[_id == $barberId][0]{_id, name, dailyAvailability[]}`, { barberId })
    ]);

    if (!service) {
      await logSanityInteraction('error', `Service not found: ${serviceId}`, 'appointment', undefined, 'customer', false, { payload: appointmentData });
      return NextResponse.json({ message: 'Service not found.' }, { status: 404 });
    }
    if (!barber) {
      await logSanityInteraction('error', `Barber not found: ${barberId}`, 'appointment', undefined, 'customer', false, { payload: appointmentData });
      return NextResponse.json({ message: 'Barber not found.' }, { status: 404 });
    }

    const serviceDuration = service.duration;
    const appointmentEndTime = addMinutes(requestedDateTime, serviceDuration);

    // 3. Check Barber Availability (Server-side re-validation)
    const requestedDayOfWeek = format(requestedDateTime, 'EEEE').toLowerCase();
    const isBarberAvailable = barber.dailyAvailability.some((block: any) => {
      const [startHour, startMinute] = block.startTime.split(':').map(Number);
      const [endHour, endMinute] = block.endTime.split(':').map(Number);

      const blockStartTime = setMinutes(setHours(requestedDateTime, startHour), startMinute);
      const blockEndTime = setMinutes(setHours(requestedDateTime, endHour), endMinute);

      return (
        block.dayOfWeek === requestedDayOfWeek &&
        (isEqual(requestedDateTime, blockStartTime) || isAfter(requestedDateTime, blockStartTime)) &&
        (isEqual(appointmentEndTime, blockEndTime) || isBefore(appointmentEndTime, blockEndTime))
      );
    });

    if (!isBarberAvailable) {
      await logSanityInteraction('error', `Barber ${barber.name} is not available at the requested time.`, 'appointment', undefined, 'customer', false, { payload: appointmentData });
      return NextResponse.json({ message: 'Selected barber is not available at this time.' }, { status: 400 });
    }

    // 4. Check for Time Slot Conflicts (Server-side re-validation)
    // Fetch existing appointments for the selected barber on the requested day
    const startOfDayRequested = startOfDay(requestedDateTime).toISOString();
    const endOfDayRequested = endOfDay(requestedDateTime).toISOString();

    const existingAppointments = await client.fetch(
      groq`*[_type == "appointment" && barber._ref == $barberId && dateTime >= $startOfDay && dateTime <= $endOfDay] {
        _id,
        dateTime,
        service->{duration}
      }`,
      { barberId, startOfDay: startOfDayRequested, endOfDay: endOfDayRequested }
    );

    const isConflict = existingAppointments.some((appt: any) => {
      const apptStartTime = parseISO(appt.dateTime);
      const apptEndTime = addMinutes(apptStartTime, appt.service.duration);

      // Check for overlap with the new appointment
      return (
        (isBefore(requestedDateTime, apptEndTime) && isAfter(appointmentEndTime, apptStartTime)) ||
        isEqual(requestedDateTime, apptStartTime) ||
        isEqual(appointmentEndTime, apptEndTime)
      );
    });

    if (isConflict) {
      await logSanityInteraction('error', 'Requested time slot conflicts with an existing appointment.', 'appointment', undefined, 'customer', false, { payload: appointmentData });
      return NextResponse.json({ message: 'This time slot is no longer available. Please choose another.' }, { status: 409 }); // 409 Conflict
    }

    // 5. Find or Create Customer (Temporary/Guest vs. Account Creation Intent)
    let customer = await client.fetch(groq`*[_type == "customer" && email == $email][0]`, { email: customerEmail });

    if (!customer) {
      // Create new customer
      const newCustomerDoc = {
        _type: 'customer',
        name: customerName,
        email: customerEmail,
        phone: customerPhone, // Phone is now required
        loyaltyPoints: 0, // Initialize loyalty points
        // If you had an 'isGuest' field in Sanity schema, you'd set it here:
        // isGuest: !createAccount,
      };
      customer = await writeClient.create(newCustomerDoc);
      customerId = customer._id;
      await logSanityInteraction('create', `New customer created: ${customerName} (${customerEmail}). Account creation intent: ${createAccount}`, 'customer', customerId, 'customer', true, { payload: newCustomerDoc, createAccountIntent: createAccount });

      if (createAccount) {
        // TODO: In a real application, this is where you'd trigger a user registration/authentication flow.
        // This might involve:
        // 1. Sending a verification email.
        // 2. Prompting the user to set a password.
        // 3. Integrating with a separate authentication service (e.g., Firebase Auth, Auth0).
        // For now, we'll just log the intent.
        await logSanityInteraction('system', `Customer ${customerName} (ID: ${customerId}) opted to create an account. Further authentication setup needed.`, 'customer', customerId, 'system', true);
      }

    } else {
      customerId = customer._id;
      // Update existing customer's phone if provided and different
      if (customer.phone !== customerPhone) { // Only update if different
        await writeClient
          .patch(customerId)
          .set({ phone: customerPhone })
          .commit();
        await logSanityInteraction('update', `Customer phone updated: ${customerName}`, 'customer', customerId, 'customer', true, { oldValue: customer.phone, newValue: customerPhone });
      }
      // If an existing customer opted to create an account, and they don't have one yet (e.g., no password hash)
      // This would also be part of the TODO above.
      if (createAccount) {
        await logSanityInteraction('system', `Existing customer ${customerName} (ID: ${customerId}) opted to create an account. Further authentication setup needed.`, 'customer', customerId, 'system', true);
      }
    }

    // 6. Create Appointment Document
    const newAppointmentDoc = {
      _type: 'appointment',
      customer: {
        _type: 'reference',
        _ref: customerId,
      },
      barber: {
        _type: 'reference',
        _ref: barberId,
      },
      service: {
        _type: 'reference',
        _ref: serviceId,
      },
      dateTime: requestedDateTime.toISOString(), // Store as ISO string
      status: 'pending', // Default status
      notes: notes || null,
      log: [
        {
          _key: `log-${Date.now()}`, // Unique key for array item
          _type: 'logEntry',
          timestamp: new Date().toISOString(),
          type: 'creation',
          message: `Appointment created by ${customerName}.`,
          user: customerId,
        },
      ],
    };

    const createdAppointment = await writeClient.create(newAppointmentDoc);
    await logSanityInteraction('create', `Appointment booked for ${customerName} with ${barber.name} for ${service.name}.`, 'appointment', createdAppointment._id, customerId, true, { payload: newAppointmentDoc });

    return NextResponse.json({ message: 'Appointment booked successfully!', appointmentId: createdAppointment._id }, { status: 201 });

  } catch (error: any) {
    console.error('Error booking appointment:', error);
    let errorMessage = 'Failed to book appointment. An unexpected error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Booking failed: ${errorMessage}`, 'appointment', undefined, customerId || 'unknown', false, { errorDetails: errorMessage, payload: appointmentData });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
