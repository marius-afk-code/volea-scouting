import { NextRequest, NextResponse } from 'next/server';

// Rutas protegidas: todo lo que esté bajo /app/*
// El cookie __session se establece client-side desde AuthContext tras el login.
// La verificación criptográfica real se hace en las API routes con firebase-admin.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo proteger rutas de la app de usuario
  if (!pathname.startsWith('/app')) {
    return NextResponse.next();
  }

  const session = req.cookies.get('__session')?.value;

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
