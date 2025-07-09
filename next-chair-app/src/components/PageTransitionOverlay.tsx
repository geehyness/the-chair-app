// src/components/PageTransitionOverlay.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Spinner, Flex, Text, useColorModeValue } from '@chakra-ui/react';

interface PageTransitionOverlayProps {
  isTransitioning: boolean; // True when page content is loading/changing
  onTransitionEnd: () => void; // Callback when the 'revealing' animation finishes
}

export function PageTransitionOverlay({ isTransitioning, onTransitionEnd }: PageTransitionOverlayProps) {
  const [showSpinner, setShowSpinner] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'covering' | 'revealing'>('idle');

  // Ref to track if the component is mounted to prevent state updates on unmount
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (isTransitioning) {
      // When transition starts, immediately start the 'covering' animation
      setAnimationPhase('covering');
      // Show spinner slightly after covering animation begins
      const spinnerShowTimeout = setTimeout(() => {
        if (mounted.current) setShowSpinner(true);
      }, 200); // Adjust to sync with your CSS animation delays
      return () => clearTimeout(spinnerShowTimeout);
    } else {
      // When new page content is ready (isTransitioning becomes false), start 'revealing'
      if (animationPhase === 'covering' || animationPhase === 'revealing') {
        setAnimationPhase('revealing');
        // Hide spinner slightly before revealing animation completes
        const spinnerHideTimeout = setTimeout(() => {
          if (mounted.current) setShowSpinner(false);
        }, 100); // Adjust to sync with your CSS animation
        return () => clearTimeout(spinnerHideTimeout);
      }
    }
  }, [isTransitioning, animationPhase]); // Depend on both to manage phases

  // This handles the end of the CSS animations for the rows
  const handleAnimationEnd = (e: React.AnimationEvent) => {
    // Only trigger `onTransitionEnd` when the 'reveal-screen' animation on the LAST row completes
    if (e.animationName === 'reveal-screen' && e.target === e.currentTarget && animationPhase === 'revealing') {
      if (mounted.current) {
        setAnimationPhase('idle'); // Reset phase to idle
        onTransitionEnd(); // Notify parent that transition is truly complete
      }
    }
  };

  if (animationPhase === 'idle' && !isTransitioning) {
    return null; // Don't render anything when no animation is active
  }

  // Spinner color from theme
  const spinnerColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      // Only allow pointer events when covering the screen
      pointerEvents={animationPhase === 'covering' || animationPhase === 'revealing' ? 'all' : 'none'}
      zIndex="9999" // Ensure it's above other content
    >
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          className={`wipe-row ${animationPhase === 'covering' ? 'wipe-in' : animationPhase === 'revealing' ? 'wipe-out' : ''} wipe-delay-${i + 1}`}
          style={{ top: `${i * 25}vh` }} // Set vertical position
          onAnimationEnd={i === 3 ? handleAnimationEnd : undefined} // Only last row triggers the end handler
        />
      ))}

      <Flex
        className={`loading-spinner-container ${showSpinner ? 'show' : ''}`}
        align="center"
        justify="center"
        direction="column"
        color={spinnerColor}
      >
        <Spinner size="xl" thickness="4px" speed="0.65s" />
        <Text mt={2}>Loading...</Text>
      </Flex>
    </Box>
  );
}