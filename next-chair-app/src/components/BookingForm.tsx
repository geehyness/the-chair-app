// the-chair-app/components/BookingForm.tsx
'use client'; // This directive marks this as a Client Component

import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';

// Define TypeScript interfaces for props
interface Barber {
  _id: string;
  name: string;
  dailyAvailability: Array<{ // Updated interface for granular availability
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

interface Service {
  _id: string;
  name: string;
  duration: number;
  price: number;
  barbers: { _id: string; name: string }[];
}

interface BookingFormProps {
  barbers: Barber[];
  services: Service[];
}

const BookingForm: React.FC<BookingFormProps> = ({ barbers, services }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>(services);

  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.300', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');


  // Effect to filter services based on selected barber
  useEffect(() => {
    if (selectedBarberId) {
      const barberSpecificServices = services.filter(service =>
        service.barbers.some(b => b._id === selectedBarberId)
      );
      setFilteredServices(barberSpecificServices);
      // Reset selected service if it's no longer available for the chosen barber
      if (selectedServiceId && !barberSpecificServices.some(s => s._id === selectedServiceId)) {
        setSelectedServiceId('');
      }
    } else {
      setFilteredServices(services); // Show all services if no barber is selected
    }
  }, [selectedBarberId, services, selectedServiceId]);

  // Effect to calculate available times based on selected barber and date
  useEffect(() => {
    if (selectedBarberId && selectedDate) {
      const barber = barbers.find(b => b._id === selectedBarberId);
      const date = new Date(selectedDate);
      const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

      if (barber && barber.dailyAvailability) {
        const slotsForDay = barber.dailyAvailability.filter(block => block.dayOfWeek === dayOfWeek);
        const generatedTimes: string[] = [];

        slotsForDay.forEach(block => {
          const [startHour, startMinute] = block.startTime.split(':').map(Number);
          const [endHour, endMinute] = block.endTime.split(':').map(Number);

          let currentTime = new Date(date);
          currentTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date(date);
          endTime.setHours(endHour, endMinute, 0, 0);

          // Generate 30-minute slots
          while (currentTime.getTime() < endTime.getTime()) {
            const hours = currentTime.getHours().toString().padStart(2, '0');
            const minutes = currentTime.getMinutes().toString().padStart(2, '0');
            generatedTimes.push(`${hours}:${minutes}`);
            currentTime.setMinutes(currentTime.getMinutes() + 30); // Increment by 30 minutes
          }
        });

        // Filter out times that are in the past for today's date
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const filteredPastTimes = generatedTimes.filter(time => {
          if (isToday) {
            const [hour, minute] = time.split(':').map(Number);
            const slotTime = new Date(date);
            slotTime.setHours(hour, minute, 0, 0);
            return slotTime.getTime() > now.getTime();
          }
          return true;
        });

        setAvailableTimes(filteredPastTimes.sort()); // Sort times chronologically
      } else {
        setAvailableTimes([]);
      }
      setSelectedTime(''); // Reset selected time when barber or date changes
    } else {
      setAvailableTimes([]);
    }
  }, [selectedBarberId, selectedDate, barbers]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic client-side validation
    if (!customerName || !customerEmail || !selectedBarberId || !selectedServiceId || !selectedDate || !selectedTime) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      console.warn('Booking form submission failed: Missing required fields.'); // Use console.warn for client-side
      setLoading(false);
      return;
    }

    try {
      // First, check if customer exists or create a new one
      console.info('Attempting to find or create customer.'); // Use console.info for client-side
      const customerResponse = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerName, email: customerEmail, phone: customerPhone }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.message || 'Failed to process customer information.');
      }
      const customerData = await customerResponse.json();
      const customerId = customerData.customer._id;
      console.info('Customer processed successfully.', { customerId }); // Use console.info for client-side

      // Construct the full dateTime string
      const fullDateTime = `${selectedDate}T${selectedTime}:00.000Z`;

      // Now, book the appointment
      console.info('Attempting to book appointment.', { customerId, selectedBarberId, selectedServiceId, fullDateTime }); // Use console.info for client-side
      const appointmentResponse = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          barberId: selectedBarberId,
          serviceId: selectedServiceId,
          dateTime: fullDateTime,
          notes,
        }),
      });

      if (!appointmentResponse.ok) {
        const errorData = await appointmentResponse.json();
        throw new Error(errorData.message || 'Failed to book appointment.');
      }

      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      console.info('Appointment booked successfully.', { customerId, appointmentId: (await appointmentResponse.json()).appointment._id }); // Use console.info for client-side
      // Clear form fields
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSelectedBarberId('');
      setSelectedServiceId('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An unexpected error occurred.' });
      console.error('Error during appointment booking process:', { message: error.message, stack: error.stack }); // Use console.error for client-side
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in ISO-MM-DD format for min attribute of date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      {message && (
        <Alert status={message.type} mb={4} rounded="md">
          <AlertIcon />
          <Text textAlign="center" flex="1">{message.text}</Text>
        </Alert>
      )}

      <VStack spacing={6} align="stretch">
        {/* Customer Information */}
        <HStack spacing={4} align="stretch" flexWrap="wrap">
          <FormControl id="customerName" isRequired flex="1">
            <FormLabel color={labelColor}>Your Name</FormLabel>
            <Input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
            />
          </FormControl>
          <FormControl id="customerEmail" isRequired flex="1">
            <FormLabel color={labelColor}>Your Email</FormLabel>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
            />
          </FormControl>
        </HStack>
        <FormControl id="customerPhone">
          <FormLabel color={labelColor}>Phone Number</FormLabel>
          <Input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

        {/* Appointment Details */}
        <FormControl id="barber" isRequired>
          <FormLabel color={labelColor}>Select Barber</FormLabel>
          <Select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          >
            <option value="">-- Choose a Barber --</option>
            {barbers.map((barber) => (
              <option key={barber._id} value={barber._id}>{barber.name}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl id="service" isRequired isDisabled={!selectedBarberId}>
          <FormLabel color={labelColor}>Select Service</FormLabel>
          <Select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          >
            <option value="">-- Choose a Service --</option>
            {filteredServices.map((service) => (
              <option key={service._id} value={service._id}>
                {service.name} (R{service.price.toFixed(2)} - {service.duration} mins)
              </option>
            ))}
          </Select>
        </FormControl>

        <HStack spacing={4} align="stretch" flexWrap="wrap">
          <FormControl id="date" isRequired flex="1">
            <FormLabel color={labelColor}>Date</FormLabel>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today} // Prevent selecting past dates
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
            />
          </FormControl>
          <FormControl id="time" isRequired flex="1" isDisabled={!selectedDate || availableTimes.length === 0}>
            <FormLabel color={labelColor}>Time</FormLabel>
            <Select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
            >
              <option value="">-- Select Time --</option>
              {availableTimes.length > 0 ? (
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
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

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
      </VStack>
    </Box>
  );
};

export default BookingForm;
