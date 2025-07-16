/* eslint-disable react-hooks/rules-of-hooks */
// the-chair-app/components/BookingForm.tsx
'use client';

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
  useToast,
  Spinner,
  Checkbox,
  useTheme,
  Flex, // Ensure useTheme is imported
} from '@chakra-ui/react';
import { format, parseISO, addMinutes, isBefore, isAfter, isEqual, startOfDay, endOfDay, setHours, setMinutes, isToday } from 'date-fns';

interface DailyAvailability {
  _key: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Barber {
  _id: string;
  name: string;
  dailyAvailability: DailyAvailability[];
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
  const toast = useToast();
  const theme = useTheme(); // Initialize useTheme hook

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAccountChecked, setCreateAccountChecked] = useState(false);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const selectedService = useMemo(() => services.find(s => s._id === selectedServiceId), [services, selectedServiceId]);
  const selectedBarber = useMemo(() => barbers.find(b => b._id === selectedBarberId), [barbers, selectedBarberId]);

  const availableBarbersForService = useMemo(() => {
    if (!selectedService) {
      return barbers;
    }
    const serviceBarberIds = new Set(selectedService.barbers.map(b => b._id));
    return barbers.filter(barber => serviceBarberIds.has(barber._id));
  }, [barbers, selectedService]);

  useEffect(() => {
    const generateTimeSlots = async () => {
      if (!selectedBarber || !selectedDate || !selectedService) {
        setAvailableTimes([]);
        return;
      }

      setIsDataLoading(true);
      setError(null);

      const dayOfWeek = format(parseISO(selectedDate), 'EEEE').toLowerCase();
      const barberAvailability = selectedBarber.dailyAvailability.filter(
        (block) => block.dayOfWeek === dayOfWeek
      );

      if (barberAvailability.length === 0) {
        setAvailableTimes([]);
        setIsDataLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/appointments?barberId=${selectedBarber._id}&date=${selectedDate}`);
        if (!response.ok) {
          throw new Error('Failed to fetch existing appointments for time slot calculation.');
        }
        const existingAppointments: any[] = await response.json();

        const slots: Date[] = [];
        const bookingDuration = selectedService.duration;

        barberAvailability.forEach((block) => {
          const [startHour, startMinute] = block.startTime.split(':').map(Number);
          const [endHour, endMinute] = block.endTime.split(':').map(Number);

          let currentTime = setMinutes(setHours(parseISO(selectedDate), startHour), startMinute);
          const blockEndTime = setMinutes(setHours(parseISO(selectedDate), endHour), endMinute);

          const now = new Date();
          if (isToday(parseISO(selectedDate)) && isBefore(currentTime, now)) {
            const minutes = now.getMinutes();
            const roundedMinutes = Math.ceil(minutes / 30) * 30;
            currentTime = setMinutes(setHours(now, now.getHours()), roundedMinutes);
            if (roundedMinutes === 60) {
              currentTime = addMinutes(currentTime, -60);
              currentTime = addMinutes(currentTime, 60);
            }
          }

          if (isBefore(currentTime, setMinutes(setHours(parseISO(selectedDate), startHour), startMinute))) {
             currentTime = setMinutes(setHours(parseISO(selectedDate), startHour), startMinute);
          }

          while (isBefore(currentTime, blockEndTime)) {
            const slotEndTime = addMinutes(currentTime, bookingDuration);

            if (isAfter(slotEndTime, blockEndTime) && !isEqual(slotEndTime, blockEndTime)) {
              break;
            }

            const isConflict = existingAppointments.some(appt => {
              const apptStartTime = parseISO(appt.dateTime);
              const apptEndTime = addMinutes(apptStartTime, appt.service.duration);

              return (
                (isBefore(currentTime, apptEndTime) && isAfter(slotEndTime, apptStartTime)) ||
                isEqual(currentTime, apptStartTime) ||
                isEqual(slotEndTime, apptEndTime)
              );
            });

            if (!isConflict) {
              slots.push(currentTime);
            }
            currentTime = addMinutes(currentTime, 30);
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
        setIsDataLoading(false);
      }
    };

    generateTimeSlots();
  }, [selectedBarber, selectedDate, selectedService, toast]);

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

    const fullDateTime = `${selectedDate}T${selectedTime}:00.000Z`;

    try {
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
          createAccount: createAccountChecked,
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

      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSelectedBarberId('');
      setSelectedServiceId('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
      setAvailableTimes([]);
      setCreateAccountChecked(false);

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
  const inputBg = useColorModeValue(theme.colors.neutral.light['input-bg'], theme.colors.neutral.dark['input-bg']);
  const inputBorder = useColorModeValue(theme.colors.neutral.light['input-border'], theme.colors.neutral.dark['input-border']);
  const placeholderColor = useColorModeValue(theme.colors.neutral.light['placeholder-color'], theme.colors.neutral.dark['placeholder-color']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);

  // Define loading card background color unconditionally
  const loadingCardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']); // Using bg-card for the loading card
  const loadingCardTextColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']); // Using text-primary for loading card text

  const today = new Date().toISOString().split('T')[0];

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      p={6}
      borderRadius="lg"
      shadow="md"
      bg={useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card'])}
      position="relative"
      opacity={isDataLoading ? 0.9 : 1}
      pointerEvents={isDataLoading ? 'none' : 'auto'}
      transition="opacity 0.3s ease-in-out"
    >
      {isDataLoading && (
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={useColorModeValue('rgba(255,255,255,0.7)', 'rgba(0,0,0,0.7)')} // Semi-transparent overlay matching theme
          zIndex="overlay"
          align="center"
          justify="center"
          borderRadius="lg"
          flexDirection="column"
        >
          
          <Box
            mt={6}
            p={4}
            bg={loadingCardBg} // Use the unconditionally defined variable
            borderRadius="md"
            boxShadow="lg"
            textAlign="center"
            maxW="200px"
          >
            <br />
            <div className="barber-pole-container">
            <div className="barber-pole-ceiling">
              <div className="barber-pole-screw top-left"></div>
              <div className="barber-pole-screw top-right"></div>
            </div>
            <div className="barber-pole-mount"></div>
            <div className="barber-pole"></div>
          </div>
          <hr />
            <Text fontSize="lg" fontWeight="bold" color={loadingCardTextColor}>
              Loading Availability...
            </Text>
          </Box>
        </Flex>
      )}

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
            onChange={(e) => setCustomerName(e.target.value)}
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
            onChange={(e) => setCustomerEmail(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

        <FormControl id="customerPhone" isRequired>
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

        <FormControl id="service" isRequired>
          <FormLabel color={labelColor}>Select Service</FormLabel>
          <Select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
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
            onChange={(e) => setSelectedBarberId(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
            isDisabled={!selectedServiceId}
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
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
              isDisabled={!selectedBarberId || !selectedServiceId}
            />
          </FormControl>

          <FormControl id="time" isRequired>
            <FormLabel color={labelColor}>Select Time</FormLabel>
            <Select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              bg={inputBg}
              borderColor={inputBorder}
              _placeholder={{ color: placeholderColor }}
              isDisabled={!selectedDate || isDataLoading}
            >
              <option value="">-- Select Time --</option>
              {isDataLoading ? (
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
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            bg={inputBg}
            borderColor={inputBorder}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>

        <Checkbox
          isChecked={createAccountChecked}
          onChange={(e) => setCreateAccountChecked(e.target.checked)}
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

        <Text fontSize="sm" color={textColorSecondary} textAlign="center" mt={4}>
          <Text as="span" fontWeight="bold" color={theme.colors.neutral.light['status-red']}>Disclaimer:</Text> If you are more than 5 minutes late for your appointment, your barber may not be available to accommodate you, and your appointment might be cancelled.
        </Text>
      </VStack>
    </Box>
  );
};

export default BookingForm;
