import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const i18n = {
  defaultLocale: 'ar',
  locales: ['ar', 'en'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    return NextResponse.redirect(
      new URL(
        `/${i18n.defaultLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    );
  }

  // Extract current locale and clean pathname
  const locale =
    i18n.locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ||
    i18n.defaultLocale;
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

  const token = request.cookies.get('jwt_access_token')?.value;

  // Protect dashboard routes server-side
  if (pathWithoutLocale.startsWith('/dashboard') && !token) {
    const signInUrl = new URL(`/${locale}/auth/sign-in`, request.url);
    signInUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from guest auth pages
  if (
    (pathWithoutLocale.startsWith('/auth/sign-in') || pathWithoutLocale.startsWith('/auth/sign-up')) &&
    token
  ) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, `/assets/`, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo|assets).*)'],
};
