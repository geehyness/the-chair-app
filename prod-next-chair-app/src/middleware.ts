// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin credentials loaded from environment variables
// These are server-side variables, no NEXT_PUBLIC_ prefix needed
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@thechairapp'; // Fallback for development if not set
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default_admin_password'; // Fallback, but should be set securely

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`\n--- Middleware Start ---`);
  console.log(`[Middleware] Current Pathname: ${pathname}`);

  const sessionToken = request.cookies.get('session_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  console.log(`[Middleware] Session Token: ${sessionToken ? 'Present' : 'Not Present'}`);
  console.log(`[Middleware] User Role: ${userRole || 'N/A'}`);

  // Define protected routes and their required roles
  const protectedRoutes = {
    '/admin': ['admin'],
    '/barber-dashboard': ['admin', 'receptionist', 'barber'],
    '/barber-dashboard/admin-reports': ['admin'],
    '/barber-dashboard/messages': ['admin', 'receptionist', 'barber'],
  };

  // Check if the current path is a protected route
  let isProtectedRoute = false;
  console.log(`[Middleware] Checking if ${pathname} is a protected route...`);
  for (const routePrefix in protectedRoutes) {
    if (pathname.startsWith(routePrefix)) {
      isProtectedRoute = true;
      console.log(`[Middleware] MATCH: Pathname "${pathname}" starts with protected route prefix "${routePrefix}".`);
      break;
    } else {
      console.log(`[Middleware] NO MATCH: Pathname "${pathname}" does NOT start with "${routePrefix}".`);
    }
  }
  console.log(`[Middleware] Final isProtectedRoute status: ${isProtectedRoute}`);


  // If accessing the login page, allow it
  if (pathname === '/login') {
    console.log('[Middleware] Allowing access to /login page.');
    console.log(`--- Middleware End ---\n`);
    return NextResponse.next();
  }

  // If accessing a protected route without a session token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    console.log(`[Middleware] ACTION: Redirecting to login from ${pathname} (no session token).`);
    console.log(`--- Middleware End ---\n`);
    return NextResponse.redirect(url);
  }

  // If there's a session token, validate role for protected routes
  if (isProtectedRoute && sessionToken) {
    const matchedRoutePrefix = Object.keys(protectedRoutes).find(route => pathname.startsWith(route));
    const requiredRoles = matchedRoutePrefix ? protectedRoutes[matchedRoutePrefix as keyof typeof protectedRoutes] : [];

    console.log(`[Middleware] Required Roles for ${pathname}: ${requiredRoles.join(', ')}`);
    if (requiredRoles.length > 0 && (!userRole || !requiredRoles.includes(userRole))) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      console.log(`[Middleware] ACTION: Redirecting to unauthorized from ${pathname} (insufficient role: ${userRole}).`);
      console.log(`--- Middleware End ---\n`);
      return NextResponse.redirect(url);
    }
  }

  console.log(`[Middleware] Allowing access to ${pathname}.`);
  console.log(`--- Middleware End ---\n`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/barber-dashboard/:path*',
  ],
};
