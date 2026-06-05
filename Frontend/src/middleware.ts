import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const session = request.cookies.get('cuadra-session');
  if (!session) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/|manifest\\.json|\\.png|\\.ico|\\.svg|\\.jpg|\\.webp).*)',
  ],
};
