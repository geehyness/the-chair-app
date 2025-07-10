// src/components/PageTransitionProvider.tsx
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, useColorModeValue, Spinner, Text } from '@chakra-ui/react'; // Import Spinner and Text
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

  // Reset transition state when navigating to a new path
  useEffect(() => {
    // When pathname changes, we consider a new page load initiated.
    // The overlay should be shown if `startTransition` was called.
    // It will be hidden by `signalPageLoaded` from the new page.
    setIsTransitioning(false); // Reset to false on new page render, will be true if startTransition was called
    if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
    }
  }, [pathname]);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    // Set a timeout to automatically hide the overlay if signalPageLoaded is not called
    // This prevents the overlay from getting stuck if a page fails to load or signal
    transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        console.warn("Page transition timed out. Overlay hidden automatically.");
    }, 5000); // Hide after 5 seconds (adjust as needed)
  }, []);

  const signalPageLoaded = useCallback(() => {
    if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
    }
    // Delay hiding the overlay slightly to allow content to render smoothly
    // and to ensure the `exit` animation has time to run.
    setTimeout(() => {
        setIsTransitioning(false);
    }, 200); // Adjust this delay as needed (e.g., 100ms-300ms)
  }, []);

  const overlayBgColor = useColorModeValue('white', 'gray.900');
  const spinnerColor = useColorModeValue('brand.500', 'brand.300'); // Define spinner color

  return (
    <PageTransitionContext.Provider value={{ startTransition, signalPageLoaded, isTransitioning }}>
      <AnimatePresence mode="wait">
        {isTransitioning && ( // Overlay is visible if a transition is active
          <motion.div
            key="page-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} // This exit runs when `isTransitioning` becomes false (after signalPageLoaded)
            transition={{ duration: 0.4 }} // Duration of the fade in/out animation
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: overlayBgColor,
              zIndex: 9999, // Ensure it's on top of everything
              display: 'flex',
              flexDirection: 'column', // Allow stacking spinner and text
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none', // Allows interaction with the underlying page once faded out
            }}
          >
            {/* Added a Spinner and a more prominent message */}
            <Spinner
              size="xl" // Large spinner
              color={spinnerColor} // Use theme-aware color
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
            />
            <Text mt={4} fontSize="xl" fontWeight="bold" color={spinnerColor}>
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