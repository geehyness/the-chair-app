// src/components/Navbar.tsx
'use client'

import React, { useState } from 'react';
import {
  Box, Flex, Heading, Button, Stack, useColorMode, useColorModeValue, IconButton, Menu, MenuButton, MenuList, MenuItem, Link as ChakraLink, Text, useTheme,
  Spinner,
  Icon,
  Image,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { usePageTransition } from './PageTransitionProvider';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  type: 'customer' | 'dashboard';
  appName?: string;
  siteLogoUrl?: string;
}

export function Navbar({ type, appName = 'The Chair App', siteLogoUrl }: NavbarProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  const router = useRouter();
  const { startTransition } = usePageTransition();
  const { isAuthenticated, logout, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const customerLinks = [
    { label: 'Home', href: '/' },
    { label: 'Book', href: '/book' },
    { label: 'Barbers', href: '/barbers' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ];

  const dashboardLinks = [
    { label: 'Today\'s Appointments', href: '/barber-dashboard' },
    { label: 'Manage Data', href: '/barber-dashboard/manage' },
    { label: 'Reports', href: '/barber-dashboard/admin-reports' },
    { label: 'Messages', href: '/barber-dashboard/messages' },
  ];

  const currentLinks = type === 'customer' ? customerLinks : dashboardLinks;

  const navBg = useColorModeValue(theme.colors.neutral.light['bg-header'], theme.colors.neutral.dark['bg-header']);
  const textColor = useColorModeValue(theme.colors.neutral.light['text-header'], theme.colors.neutral.dark['text-header']);
  const hoverBg = useColorModeValue(theme.colors.brand['100'], theme.colors.brand['700']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);

  const displayedIconUrl = siteLogoUrl || "https://placehold.co/40x40/326AA0/FFFFFF?text=App";

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
        <NextLink href="/" passHref>
          <Flex alignItems="center" cursor="pointer">
            <Image
              src={displayedIconUrl}
              alt={`${appName} Logo`}
              boxSize="40px"
              borderRadius="full"
              objectFit="cover"
              mr={2}
            />
            <Heading as="h1" size="md" color={textColor}>
              {appName}
            </Heading>
          </Flex>
        </NextLink>

        {/* Desktop Navigation */}
        <Flex as="nav" display={{ base: 'none', md: 'flex' }} alignItems="center" ml={10}>
          <Stack direction={'row'} spacing={7}>
            {currentLinks.map((link) => (
              <NextLink key={link.href} href={link.href} passHref>
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
            {isAdmin && (
              <NextLink href="/admin" passHref>
                <ChakraLink
                  as={Button}
                  variant="ghost"
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  onClick={(e) => {
                    e.preventDefault();
                    startTransition();
                    router.push('/admin');
                  }}
                >
                  Admin Panel
                </ChakraLink>
              </NextLink>
            )}

            {/* Conditional Login/Logout Button: ONLY show on dashboard type pages */}
            {type === 'dashboard' && (
              isAuthenticated ? (
                <Button
                  variant="ghost"
                  colorScheme="red"
                  onClick={logout}
                  _hover={{ bg: 'red.700' }}
                  leftIcon={<Icon as={FiLogOut} />}
                >
                  Logout
                </Button>
              ) : (
                <NextLink href="/login" passHref>
                  <Button
                    colorScheme="brand"
                    onClick={(e) => {
                      e.preventDefault();
                      startTransition();
                      router.push('/login');
                    }}
                  >
                    Login
                  </Button>
                </NextLink>
              )
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
              {isAdmin && (
                <MenuItem
                  _hover={{ bg: hoverBg }}
                  color={textColor}
                  onClick={() => {
                    startTransition();
                    router.push('/admin');
                    setIsOpen(false);
                  }}
                >
                  Admin Panel
                </MenuItem>
              )}
              {/* Conditional Login/Logout Button for Mobile Menu: ONLY show on dashboard type pages */}
              {type === 'dashboard' && (
                isAuthenticated ? (
                  <MenuItem
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    _hover={{ bg: 'red.700' }}
                    color="red.400"
                    icon={<Icon as={FiLogOut} />}
                  >
                    Logout
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() => {
                      startTransition();
                      router.push('/login');
                      setIsOpen(false);
                    }}
                    _hover={{ bg: hoverBg }}
                    color={textColor}
                  >
                    Login
                  </MenuItem>
                )
              )}
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}
