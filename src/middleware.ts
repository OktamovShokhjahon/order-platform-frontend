import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const suffix = pathname.slice('/admin'.length);
    const url = request.nextUrl.clone();
    url.pathname = suffix ? `/en/admin${suffix}` : '/en/admin/dashboard';
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|ru|uz)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
