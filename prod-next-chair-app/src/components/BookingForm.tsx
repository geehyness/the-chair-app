// the-chair-app/components/BookingForm.tsx
'use client'; // This directive marks this as a Client Component

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast, // Import useToast for notifications
  Spinner, // For loading states
  Checkbox, // Import Checkbox for account creation option
  useTheme, // Import useTheme hook
} from '@chakra-ui/react';
import { format, parseISO, addMinutes, isBefore, isAfter, isEqual, startOfDay, endOfDay, setHours, setMinutes, isToday } from 'date-fns'; // <--- ADDED isToday HERE

// Define TypeScript interfaces for props (ensure these match what's passed from page.tsx)
interface DailyAvailability {
  _key: string;
  dayOfWeek: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
}

interface Barber {
  _id: string;
  name: string;
  dailyAvailability: DailyAvailability[];
}

interface Service {
  _id: string;
  name: string;
  duration: number; // Duration in minutes
  price: number;
  barbers: { _id: string; name: string }[]; // Dereferenced barbers for convenience
}

interface BookingFormProps {
  barbers: Barber[];
  services: Service[];
}

const BookingForm: React.FC<BookingFormProps> = ({ barbers, services }) => {
  const toast = useToast(); // Initialize toast
  const theme = useTheme(); // Initialize useTheme hook here

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState(''); // Made required
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); //YYYY-MM-DD format
  const [selectedTime, setSelectedTime] = useState(''); // HH:mm format
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAccountChecked, setCreateAccountChecked] = useState(false); // New state for account creation

  const [availableTimes, setAvailableTimes] = useState<string[]>([]); // Stores HH:mm strings
  const [fetchingTimes, setFetchingTimes] = useState(false); // New state for time slot loading

  // Memoize selected service and barber for easier access
  const selectedService = useMemo(() => services.find(s => s._id === selectedServiceId), [services, selectedServiceId]);
  const selectedBarber = useMemo(() => barbers.find(b => b._id === selectedBarberId), [barbers, selectedBarberId]);

  // Filter barbers based on selected service
  const availableBarbersForService = useMemo(() => {
    if (!selectedService) {
      return barbers; // If no service selected, all barbers are potentially available
    }
    // Filter barbers who offer the selected service
    const serviceBarberIds = new Set(selectedService.barbers.map(b => b._id));
    return barbers.filter(barber => serviceBarberIds.has(barber._id));
  }, [barbers, selectedService]);

  // Effect to generate available time slots based on selected barber, date, and service duration
  useEffect(() => {
    const generateTimeSlots = async () => {
      if (!selectedBarber || !selectedDate || !selectedService) {
        setAvailableTimes([]);
        return;
      }

      setFetchingTimes(true);
      setError(null);

      const dayOfWeek = format(parseISO(selectedDate), 'EEEE').toLowerCase(); // e.g., "monday"
      const barberAvailability = selectedBarber.dailyAvailability.filter(
        (block) => block.dayOfWeek === dayOfWeek
      );

      if (barberAvailability.length === 0) {
        setAvailableTimes([]);
        setFetchingTimes(false);
        return;
      }

      try {
        // Fetch existing appointments for the selected barber and date
        const response = await fetch(`/api/appointments?barberId=${selectedBarber._id}&date=${selectedDate}`);
        if (!response.ok) {
          throw new Error('Failed to fetch existing appointments for time slot calculation.');
        }
        const existingAppointments: any[] = await response.json();

        const slots: Date[] = [];
        const bookingDuration = selectedService.duration; // Duration of the selected service

        barberAvailability.forEach((block) => {
          const [startHour, startMinute] = block.startTime.split(':').map(Number);
          const [endHour, endMinute] = block.endTime.split(':').map(Number);

          let currentTime = setMinutes(setHours(parseISO(selectedDate), startHour), startMinute);
          const blockEndTime = setMinutes(setHours(parseISO(selectedDate), endHour), endMinute);

          // Adjust for current time if selectedDate is today
          const now = new Date();
          if (isToday(parseISO(selectedDate)) && isBefore(currentTime, now)) {
            // Round up to the next 30-minute interval from now
            const minutes = now.getMinutes();
            const roundedMinutes = Math.ceil(minutes / 30) * 30; // Changed to 30-minute intervals
            currentTime = setMinutes(setHours(now, now.getHours()), roundedMinutes);
            // If rounding up pushes to next hour, adjust hour
            if (roundedMinutes === 60) {
              currentTime = addMinutes(currentTime, -60); // Reset minutes to 0
              currentTime = addMinutes(currentTime, 60); // Add an hour
            }
          }

          // Ensure currentTime is not before the block's start time after adjustment
          if (isBefore(currentTime, setMinutes(setHours(parseISO(selectedDate), startHour), startMinute))) {
             currentTime = setMinutes(setHours(parseISO(selectedDate), startHour), startMinute);
          }


          while (isBefore(currentTime, blockEndTime)) {
            const slotEndTime = addMinutes(currentTime, bookingDuration);

            // Check if the slot fits within the availability block
            if (isAfter(slotEndTime, blockEndTime) && !isEqual(slotEndTime, blockEndTime)) {
              break; // Slot extends beyond availability block
            }

            // Check for conflicts with existing appointments
            const isConflict = existingAppointments.some(appt => {
              const apptStartTime = parseISO(appt.dateTime);
              const apptEndTime = addMinutes(apptStartTime, appt.service.duration); // Assuming service.duration is available on fetched appt

              // Check for overlap:
              // [slotStartTime, slotEndTime] overlaps with [apptStartTime, apptEndTime]
              return (
                (isBefore(currentTime, apptEndTime) && isAfter(slotEndTime, apptStartTime)) ||
                isEqual(currentTime, apptStartTime) ||
                isEqual(slotEndTime, apptEndTime)
              );
            });

            if (!isConflict) {
              slots.push(currentTime);
            }
            currentTime = addMinutes(currentTime, 30); // Move to the next 30-minute interval
          }
        });

        setAvailableTimes(slots.map(slot => format(slot, 'HH:mm')));
        if (slots.length === 0) {
            toast({
                title: 'No available slots.',
                description: 'Please try a different date or barber.',
                status: 'info',
                duration: 5000,
                isClosable: true,
            });
        }
      } catch (err: any) {
        console.error('Error generating time slots:', err);
        setError('Could not load available times. Please try again.');
        setAvailableTimes([]);
      } finally {
        setFetchingTimes(false);
      }
    };

    generateTimeSlots();
  }, [selectedBarber, selectedDate, selectedService, toast]); // Re-run when these dependencies change

  // Reset selected time when barber, service, or date changes
  useEffect(() => {
    setSelectedTime('');
  }, [selectedBarberId, selectedServiceId, selectedDate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!customerName || !customerEmail || !customerPhone || !selectedBarberId || !selectedServiceId || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const fullDateTime = `${selectedDate}T${selectedTime}:00.000Z`; // ISO string format

    try {
      // Corrected API endpoint for booking appointments
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          barberId: selectedBarberId,
          serviceId: selectedServiceId,
          dateTime: fullDateTime,
          notes,
          createAccount: createAccountChecked, // Pass the new flag
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book appointment.');
      }

      toast({
        title: 'Appointment booked!',
        description: 'Your appointment has been successfully scheduled.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSelectedBarberId('');
      setSelectedServiceId('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
      setAvailableTimes([]); // Clear available times after booking
      setCreateAccountChecked(false); // Reset checkbox

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      toast({
        title: 'Booking failed.',
        description: err.message || 'Please try again.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Color mode values for form elements
  const labelColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const inputBg = useColorModeValue(theme.colors.neutral.light['bg-input'], theme.colors.neutral.dark['bg-input']);
  const inputBorder = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const placeholderColor = useColorModeValue(theme.colors.neutral.light['text-muted'], theme.colors.neutral.dark['text-muted']); // Using text-muted for placeholders
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);


  // Get today's date in ISO-MM-DD format for min attribute of date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} borderRadius="lg" shadow="md" bg={useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card'])}>
      <VStack spacing={5} align="stretch">
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <FormControl id="customerName" isRequired>
          <FormLabel color={labelColor}>Your Name</FormLabel>
          <Input
            type="text"
            value={customerName}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setCustomerName(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

        <FormControl id="customerEmail" isRequired>
          <FormLabel color={labelColor}>Email</FormLabel>
          <Input
            type="email"
            value={customerEmail}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setCustomerEmail(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

        <FormControl id="customerPhone" isRequired> {/* Made phone number required */}
          <FormLabel color={labelColor}>Phone Number</FormLabel>
          <Input
            type="tel"
            value={customerPhone}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setCustomerPhone(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

        <FormControl id="service" isRequired>
          <FormLabel color={labelColor}>Select Service</FormLabel>
          <Select
            value={selectedServiceId}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSelectedServiceId(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          >
            <option value="">-- Select Service --</option>
            {services.map((service) => (
              <option key={service._id} value={service._id}>
                {service.name} (E{service.price.toFixed(2)}) - {service.duration} mins
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl id="barber" isRequired>
          <FormLabel color={labelColor}>Select Barber</FormLabel>
          <Select
            value={selectedBarberId}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSelectedBarberId(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
            isDisabled={!selectedServiceId} // Disable if no service selected
          >
            <option value="">-- Select Barber --</option>
            {availableBarbersForService.map((barber) => (
              <option key={barber._id} value={barber._id}>
                {barber.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <HStack spacing={4}>
          <FormControl id="date" isRequired>
            <FormLabel color={labelColor}>Select Date</FormLabel>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')} // Prevent selecting past dates
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
              isDisabled={!selectedBarberId || !selectedServiceId} // Disable if no barber/service selected
            />
          </FormControl>

          <FormControl id="time" isRequired>
            <FormLabel color={labelColor}>Select Time</FormLabel>
            <Select
              value={selectedTime}
              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSelectedTime(e.target.value)}
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
              isDisabled={!selectedDate || fetchingTimes} // Disable if no date or fetching times
            >
              <option value="">-- Select Time --</option>
              {fetchingTimes ? (
                <option disabled>Loading times...</option>
              ) : availableTimes.length > 0 ? (
                availableTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))
              ) : (
                <option disabled>No times available for this date/barber</option>
              )}
            </Select>
          </FormControl>
        </HStack>

        <FormControl id="notes">
          <FormLabel color={labelColor}>Notes (Optional)</FormLabel>
          <Textarea
            value={notes}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNotes(e.target.value)}
            rows={3}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

        {/* New: Create Account Checkbox */}
        <Checkbox
          isChecked={createAccountChecked}
          onChange={(e: { target: { checked: boolean | ((prevState: boolean) => boolean); }; }) => setCreateAccountChecked(e.target.checked)}
          colorScheme="brand"
          color={textColorPrimary}
        >
          Create an account for next time?
        </Checkbox>

        <Button
          type="submit"
          colorScheme="brand"
          size="lg"
          isLoading={loading}
          loadingText="Booking..."
          alignSelf="center"
          w="full"
          shadow="md"
          transition="0.3s ease-in-out"
          transform="scale(1)"
          _hover={{ transform: 'scale(1.05)' }}
        >
          Confirm Appointment
        </Button>

        {/* New: Lateness Disclaimer */}
        <Text fontSize="sm" color={textColorSecondary} textAlign="center" mt={4}>
          <Text as="span" fontWeight="bold" color="red.400">Disclaimer:</Text> If you are more than 5 minutes late for your appointment, your barber may not be available to accommodate you, and your appointment might be cancelled.
        </Text>
      </VStack>
    </Box>
  );
};

export default BookingForm;
