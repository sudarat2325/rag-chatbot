import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const roleProtectedRoutes: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/driver', roles: ['DRIVER'] },
  { prefix: '/restaurant-dashboard', roles: ['RESTAURANT_OWNER', 'ADMIN'] },
  { prefix: '/admin', roles: ['ADMIN'] },
];

const authRedirectRoutes = ['/login', '/register'];

export default auth((req) => {
  const session = req.auth;
  const { nextUrl } = req;
  const { pathname, origin } = nextUrl;

  if (authRedirectRoutes.includes(pathname) && session?.user) {
    return NextResponse.redirect(new URL('/food', origin));
  }

  const matchedRoute = roleProtectedRoutes.find((route) => pathname.startsWith(route.prefix));

  if (!matchedRoute) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session.user.role ?? 'CUSTOMER';
  if (!matchedRoute.roles.includes(userRole)) {
    return NextResponse.redirect(new URL('/food', origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/driver/:path*', '/restaurant-dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
