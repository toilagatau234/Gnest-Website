import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import {
  ADMIN_IDLE_COOKIE_NAME,
  ADMIN_IDLE_TIMEOUT_MS,
  ADMIN_TIMEOUT_CLEAR_PATH,
  getAdminActivityCookieOptions,
} from '@/lib/services/admin/auth-config';

const ADMIN_TIMEOUT_EXCLUDED_PATHS = new Set([
  '/admin/login',
  '/admin/account-disabled',
  '/admin/account-disabled/clear',
  '/admin/session-timeout',
  '/admin/session-timeout/clear',
]);

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT remove this. This refreshes the session if it is expired.
  // It reads the refresh token from cookies, communicates with Supabase Auth,
  // and saves the fresh access token back to cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lastActivityCookie = request.cookies.get(ADMIN_IDLE_COOKIE_NAME)?.value;

  if (!user) {
    if (lastActivityCookie) {
      supabaseResponse.cookies.set(ADMIN_IDLE_COOKIE_NAME, '', {
        ...getAdminActivityCookieOptions(),
        maxAge: 0,
      });
    }

    return supabaseResponse;
  }

  if (ADMIN_TIMEOUT_EXCLUDED_PATHS.has(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  const lastActivity = lastActivityCookie ? Number(lastActivityCookie) : Number.NaN;
  const now = Date.now();

  if (Number.isFinite(lastActivity) && now - lastActivity >= ADMIN_IDLE_TIMEOUT_MS) {
    return NextResponse.redirect(new URL(ADMIN_TIMEOUT_CLEAR_PATH, request.url));
  }

  supabaseResponse.cookies.set(ADMIN_IDLE_COOKIE_NAME, String(now), getAdminActivityCookieOptions());

  return supabaseResponse;
}

export const config = {
  // Only run auth session refresh on admin routes.
  // Public pages do not need Supabase auth middleware overhead.
  matcher: ['/admin', '/admin/:path*'],
};
