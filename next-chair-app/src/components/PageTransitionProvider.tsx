// src/components/PageTransitionProvider.tsx
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, useColorModeValue, Spinner, Text, useTheme } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';


interface PageTransitionContextType {
  startTransition: () => void;
  signalPageLoaded: () => void; // New: Function to signal when the page content is loaded
  isTransitioning: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
};

export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme(); // Access the theme

  // Define color mode values unconditionally at the top level
  const overlayBgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const spinnerColor = useColorModeValue(theme.colors.brand['500'], theme.colors.brand['300']);
  const textColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  // FIX: Move this useColorModeValue call outside the conditional render block
  const spinnerEmptyColor = useColorModeValue('gray.200', 'gray.700');


  // Reset transition state when navigating to a new path
  useEffect(() => {
    setIsTransitioning(false);
    if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
    }
  }, [pathname]);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    // Set a timeout to automatically hide the overlay if signalPageLoaded is not called
    transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        console.warn("Page transition timed out. Overlay hidden automatically.");
    }, 5000); // Hide after 5 seconds
  }, []);

  const signalPageLoaded = useCallback(() => {
    if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
    }
    // Delay hiding the overlay slightly to allow content to render smoothly
    setTimeout(() => {
        setIsTransitioning(false);
    }, 200); // Adjust this delay as needed
  }, []);


  return (
    <PageTransitionContext.Provider value={{ startTransition, signalPageLoaded, isTransitioning }}>
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            key="page-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: overlayBgColor, // Use theme-aware background
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none', // Allows interaction with the underlying page once faded out
            }}
          >
            {/* Spinner and message directly within the motion.div */}
            <Spinner
              size="xl"
              color={spinnerColor}
              thickness="4px"
              speed="0.65s"
              emptyColor={spinnerEmptyColor} // Use the unconditionally defined variable
            />
            <Text mt={4} fontSize="xl" fontWeight="bold" color={textColor}>
              Loading...
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
      <Box key={pathname} flex="1">
        {children}
      </Box>
    </PageTransitionContext.Provider>
  );
};
