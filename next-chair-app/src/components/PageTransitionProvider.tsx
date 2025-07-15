// src/components/PageTransitionProvider.tsx
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, useColorModeValue, Text, useTheme } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import localFont from 'next/font/local';

import { Rubik_Mono_One } from 'next/font/google';

const digitalFont = Rubik_Mono_One({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});

interface PageTransitionContextType {
  startTransition: () => void;
  signalPageLoaded: () => void;
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
  const theme = useTheme();

  const overlayBgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);

  useEffect(() => {
    setIsTransitioning(false);
    if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
    }
  }, [pathname]);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        console.warn("Page transition timed out. Overlay hidden automatically.");
    }, 5000);
  }, []);

  const signalPageLoaded = useCallback(() => {
    if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
    }
    setTimeout(() => {
        setIsTransitioning(false);
    }, 200);
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
            transition={{ duration: 0.05 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: overlayBgColor,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* Custom Barber Pole Spinner */}
            <div className="barber-pole-container">
              <div className="barber-pole-ceiling">
                <div className="barber-pole-screw top-left"></div>
                <div className="barber-pole-screw top-right"></div>
              </div>
              <div className="barber-pole-mount"></div>
              <div className="barber-pole"></div>
            </div>

            {/* Glitchy Loading Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                textShadow: [
                  '0 0 0px currentColor',
                  '2px 0 5px red, -2px 0 5px blue',
                  '0 0 0px currentColor',
                  '0 0 10px currentColor',
                  '0 0 0px currentColor'
                ],
                letterSpacing: ['0px', '2px', '0px', '-1px', '0px'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              style={{
                fontFamily: digitalFont.style.fontFamily,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: textColor,
                position: 'relative',
                marginTop: '1rem',
              }}
            >
              <motion.span
                animate={{
                  opacity: [1, 0.8, 1, 0.9, 1],
                  x: [0, -2, 2, -1, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                }}
              >
                L
              </motion.span>
              <motion.span
                animate={{
                  opacity: [1, 0.7, 1, 0.6, 1],
                  x: [0, 1, -1, 2, 0],
                }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.1,
                }}
              >
                O
              </motion.span>
              <motion.span
                animate={{
                  opacity: [1, 0.5, 1, 0.4, 1],
                  x: [0, -1, 1, -2, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.2,
                }}
              >
                A
              </motion.span>
              <motion.span
                animate={{
                  opacity: [1, 0.3, 1, 0.8, 1],
                  x: [0, 2, -2, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.3,
                }}
              >
                D
              </motion.span>
              <motion.span
                animate={{
                  opacity: [1, 0.9, 1, 0.7, 1],
                  x: [0, -1, 1, -1, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.4,
                }}
              >
                I
              </motion.span>
              <motion.span
                animate={{
                  opacity: [1, 0.6, 1, 0.5, 1],
                  x: [0, 1, -1, 2, 0],
                }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.5,
                }}
              >
                N
              </motion.span>
              <motion.span
                animate={{
                  opacity: [1, 0.8, 1, 0.9, 1],
                  x: [0, -2, 2, -1, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.6,
                }}
              >
                G
              </motion.span>
              {/*<motion.span
                animate={{
                  opacity: [1, 0.3, 1, 0.2, 1],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.7,
                }}
              >
                ...
              </motion.span>*/}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Box key={pathname} flex="1">
        {children}
      </Box>
    </PageTransitionContext.Provider>
  );
};