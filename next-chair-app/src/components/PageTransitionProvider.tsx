// src/components/PageTransitionProvider.tsx
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, useColorModeValue } from '@chakra-ui/react';
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

  // Reset transition state when navigating to a new path
  useEffect(() => {
    // When pathname changes, we consider a new page load initiated.
    // The overlay should be shown if `startTransition` was called.
    // It will be hidden by `signalPageLoaded` from the new page.
    setIsTransitioning(false); // Reset to false on new page render, will be true if startTransition was called
  }, [pathname]);

  const startTransition = useCallback(() => {
    setIsTransitioning(true); // Overlay becomes visible
    // No automatic hiding timeout here. Overlay will be hidden by signalPageLoaded.
  }, []);

  const signalPageLoaded = useCallback(() => {
    // Add a small delay to ensure the new content is fully painted before
    // the overlay starts fading out, preventing visual glitches.
    setTimeout(() => {
      setIsTransitioning(false); // Overlay starts to fade out
    }, 200); // Adjust this delay as needed (e.g., 100ms-300ms)
  }, []);

  const overlayBgColor = useColorModeValue('white', 'gray.900');

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
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none', // Allows interaction with the underlying page once faded out
            }}
          >
            {/* You can add a loading spinner or logo here */}
            <Box>Loading...</Box>
          </motion.div>
        )}
      </AnimatePresence>
      <Box key={pathname} flex="1">
        {children}
      </Box>
    </PageTransitionContext.Provider>
  );
};