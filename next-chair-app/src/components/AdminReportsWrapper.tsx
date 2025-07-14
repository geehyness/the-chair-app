// src/components/AdminReportsWrapper.tsx
'use client'; // This directive marks it as a Client Component

import dynamic from 'next/dynamic';
import React from 'react';
import { Flex, Spinner, Text, useColorModeValue, useTheme } from '@chakra-ui/react';

// CORRECTED PATH: Import interfaces directly from where they are defined
import type { Barber, Appointment, Service } from '@/app/barber-dashboard/manage/page';

// Create a separate functional component for the loading state
const AdminReportsLoading = () => {
  const theme = useTheme();
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const bgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);

  return (
    <Flex justify="center" align="center" minH="80vh" bg={bgColor}>
      <Spinner size="xl" color="brand.500" />
      <Text ml={4} fontSize="xl" color={textColorSecondary}>Loading analytics...</Text>
    </Flex>
  );
};


// Dynamically import the actual AdminReportsClient with ssr: false
const AdminReportsClient = dynamic(() => import('./AdminReportsClient'), {
  ssr: false, // This is now allowed because AdminReportsWrapper is a Client Component
  loading: AdminReportsLoading, // Reference the new loading component here
});

// Define props for this wrapper, which will simply pass them down
interface AdminReportsWrapperProps {
  barbers: Barber[];
  services: Service[];
  allAppointments: Appointment[];
}

export default function AdminReportsWrapper(props: AdminReportsWrapperProps) {
  return <AdminReportsClient {...props} />;
}