import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const i18n = {
  defaultLocale: 'ar',
  locales: ['ar', 'en'],
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    // e.g. incoming request is /dashboard
    // The new URL is now /ar/dashboard
    return NextResponse.redirect(
      new URL(
        `/${i18n.defaultLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    );
  }
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, `/assets/`, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo|assets).*)'],
};
