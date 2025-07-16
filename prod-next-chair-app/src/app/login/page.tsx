// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Heading, Text, Flex, useToast, useColorModeValue, useTheme } from '@chakra-ui/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// import { client } from '@/lib/sanity'; // No longer directly fetching user from Sanity here
// import { groq } from 'next-sanity'; // No longer directly using groq here
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { login, isAuthenticated, isAuthReady } = useAuth();
  const theme = useTheme();

  const bgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const formBgColor = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const textColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);

  useEffect(() => {
    if (isAuthReady && isAuthenticated && pathname === '/login') {
      const redirectPath = searchParams.get('redirect') || '/barber-dashboard';
      console.log(`[Login Page] Already authenticated and on login page, redirecting to: ${redirectPath}`);
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, searchParams, pathname, isAuthReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', { // Call the new login API route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user; // API route returns user data on success
        login(user.email, user.username, user.role, user.phoneNumber);
        console.log(`[Login Page] User login successful (${user.email}). Cookies set: session_token=${Cookies.get('session_token')}, user_role=${Cookies.get('user_role')}`);
        toast({
          title: 'Login Successful',
          description: `Welcome, ${user.username}!`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        const redirectPath = searchParams.get('redirect') || (user.role === 'admin' ? '/admin' : '/barber-dashboard'); // Redirect based on role
        router.push(redirectPath);
      } else {
        console.log(`[Login Page] Login failed for ${email}: ${data.message}`);
        toast({
          title: 'Login Failed',
          description: data.message || 'Invalid email or password.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('[Login Page] Login error:', error);
      toast({
        title: 'An error occurred',
        description: error.message || 'Unable to log in. Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={bgColor}
      color={textColor}
      p={4}
    >
      <Box
        bg={formBgColor}
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        w="full"
        maxW="md"
      >
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          Login
        </Heading>
        <form onSubmit={handleLogin}>
          <FormControl id="email" mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </FormControl>
          <FormControl id="password" mb={6} isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </FormControl>
          <Button
            colorScheme="brand"
            width="full"
            type="submit"
            isLoading={isLoading}
            loadingText="Logging in..."
          >
            Login
          </Button>
        </form>
      </Box>
    </Flex>
  );
}
