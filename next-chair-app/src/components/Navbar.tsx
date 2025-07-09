// src/components/Navbar.tsx
'use client'

import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Button, Stack, useColorMode, useColorModeValue, IconButton, Menu, MenuButton, MenuList, MenuItem, Link as ChakraLink, Text, useTheme,
  Spinner, // Import Spinner for loading indicator
  Icon,    // Import Icon for general icon use
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { usePageTransition } from './PageTransitionProvider';
import { FiLogOut } from 'react-icons/fi'; // Import logout icon

interface NavbarProps {
  type: 'customer' | 'dashboard';
  appName?: string;
  onDashboardLogout?: () => Promise<void>;
}

export function Navbar({ type, appName = 'The Chair App', onDashboardLogout }: NavbarProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const router = useRouter();
  const { startTransition } = usePageTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const customerLinks = [
    { label: 'Home', href: '/' },
    { label: 'Book', href: '/book' },
    { label: 'Barbers', href: '/barbers' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ];

  const dashboardLinks = [
    { label: 'Today\'s Appointments', href: '/barber-dashboard' }, // New link for daily overview
    { label: 'Manage Data', href: '/barber-dashboard/manage' }, // Link to the full management dashboard
    { label: 'Reports', href: '/admin-reports' }, // Existing reports link
    // You can add other specific dashboard links here if needed
  ];

  const currentLinks = type === 'customer' ? customerLinks : dashboardLinks;

  const navBg = useColorModeValue(theme.colors.neutral.light['bg-header'], theme.colors.neutral.dark['bg-header']);
  const textColor = useColorModeValue(theme.colors.neutral.light['text-header'], theme.colors.neutral.dark['text-header']);
  const hoverBg = useColorModeValue(theme.colors.brand['100'], theme.colors.brand['700']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);

  return (
    <Box
      bg={navBg}
      px={4}
      borderBottom="1px solid"
      borderColor={borderColor}
      position="fixed"
      top="0"
      width="100%"
      zIndex="sticky"
      opacity={1}
    >
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <NextLink href="/">
          <Heading as="h1" size="md" color={textColor} _hover={{ cursor: 'pointer' }}>
            {appName}
          </Heading>
        </NextLink>

        {/* Desktop Navigation */}
        <Flex as="nav" display={{ base: 'none', md: 'flex' }} alignItems="center" ml={10}>
          <Stack direction={'row'} spacing={7}>
            {currentLinks.map((link) => (
              <NextLink key={link.href} href={link.href}>
                <ChakraLink
                  as={Button}
                  variant="ghost"
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  onClick={(e) => {
                    e.preventDefault();
                    startTransition();
                    router.push(link.href);
                  }}
                >
                  {link.label}
                </ChakraLink>
              </NextLink>
            ))}
            {type === 'dashboard' && (
              <Button
                variant="ghost"
                colorScheme="red"
                isLoading={isLogoutLoading}
                onClick={async () => {
                  setIsLogoutLoading(true);
                  if (onDashboardLogout) {
                    await onDashboardLogout();
                  }
                  setIsLogoutLoading(false);
                }}
                _hover={{ bg: 'red.700' }}
              >
                Logout
              </Button>
            )}
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              color={textColor}
              _hover={{ bg: hoverBg }}
            />
          </Stack>
        </Flex>

        {/* Mobile Menu Button */}
        <Flex display={{ base: 'flex', md: 'none' }} alignItems="center">
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            color={textColor}
            _hover={{ bg: hoverBg }}
            mr={2}
          />
          <Menu isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              variant="outline"
              colorScheme="purple"
              borderColor={borderColor}
              color={textColor}
              onClick={toggleMenu}
            />
            <MenuList bg={navBg} borderColor={borderColor} p={2}>
              {currentLinks.map((link) => (
                <MenuItem
                  key={link.href}
                  _hover={{ bg: hoverBg }}
                  color={textColor}
                  onClick={(e) => {
                    startTransition();
                    router.push(link.href);
                    setIsOpen(false);
                  }}
                >
                  {link.label}
                </MenuItem>
              ))}
              {type === 'dashboard' && (
                <MenuItem
                  isDisabled={isLogoutLoading}
                  onClick={async () => {
                    setIsLogoutLoading(true);
                    if (onDashboardLogout) {
                      await onDashboardLogout();
                    }
                    setIsLogoutLoading(false);
                    setIsOpen(false);
                  }}
                  _hover={{ bg: 'red.700' }}
                  color="red.400"
                  icon={isLogoutLoading ? <Spinner size="sm" /> : <Icon as={FiLogOut} />}
                >
                  {isLogoutLoading ? 'Logging out...' : 'Logout'}
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}
